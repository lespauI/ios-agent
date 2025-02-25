// src/core/test-runner.ts
import { Browser } from 'webdriverio';
import path from 'path';
import { LLMResult } from '../types/llm-types';
import { TestStep, TestActionType } from '../types/test-types';
import { findElement, ElementInfo } from '../device/element-finder';
import { tapElement, typeIntoElement, bypassPopups } from '../device/actions';
import { captureScreenshot, getPageSource } from '../device/screen-capture';
import { appendToLog, createTestStep } from '../utils/logger';
import { getScreenshotPath } from '../utils/file-manager';
import { TestStateTracker } from './state-tracker';
import { CriticalTestError } from '../types/error-types';
import { verifyElement } from '../device/actions';


export async function executeTestStep(
  driver: Browser,
  stepIndex: number,
  userPrompt: string,
  screenshotsDir: string,
  logFilePath: string,
  llmService: any,
  stateTracker: TestStateTracker
): Promise<{
  shouldContinue: boolean;
  isComplete: boolean;
}> {
  console.log(`\n--- Step ${stepIndex} ---`);
  
  // Check if we should continue based on previous failures
  if (!stateTracker.shouldContinue()) {
    const failureState = stateTracker.getFailureState();
    console.error(`Test stopped after ${failureState.consecutiveFailures} consecutive failures.`);
    console.error(`Last failure: ${failureState.lastFailureReason}`);
    
    const screenshotPath = getScreenshotPath(screenshotsDir, stepIndex);
    await captureScreenshot(driver, screenshotPath);
    
    await appendToLog(logFilePath, createTestStep(
      stepIndex,
      TestActionType.TEST_FAILED,
      `Test stopped after ${failureState.consecutiveFailures} consecutive failures: ${failureState.lastFailureReason}`,
      screenshotPath
    ));
    
    return { shouldContinue: false, isComplete: false };
  }
  
  const screenshotPath = getScreenshotPath(screenshotsDir, stepIndex);
  await captureScreenshot(driver, screenshotPath);
  await bypassPopups(driver);

  const pageSource = await getPageSource(driver);
  
  // Record the current screen in the state tracker
  // We can use a hash of the page source as a simple screen identifier
  const screenId = Buffer.from(pageSource).toString('base64').slice(0, 50);
  stateTracker.recordVisitedScreen(screenId);
  
  try {
    // Include state information in the LLM prompt
    const failureState = stateTracker.getFailureState();
    const stateInfo = {
      consecutiveFailures: failureState.consecutiveFailures,
      lastFailureReason: failureState.lastFailureReason,
      failedElements: Array.from(failureState.failedElements)
    };
    
    const llmResult = await llmService.callLLM(
      userPrompt,
      pageSource,
      screenshotPath,
      stateInfo
    );

    await logLlmDecision(stepIndex, llmResult, screenshotPath, logFilePath);

    if (llmResult.nextAction === 'DONE') {
      await logTestComplete(stepIndex, screenshotPath, logFilePath);
      return { shouldContinue: false, isComplete: true };
    }

    const actionResult = await executeAction(
      driver, 
      stepIndex, 
      llmResult, 
      screenshotPath, 
      logFilePath,
      stateTracker
    );
    
    return { shouldContinue: actionResult, isComplete: false };
  } catch (error) {
    console.error('Step execution error:', error);
    
    // Record the failure in the state tracker
    stateTracker.recordFailure(
      error instanceof Error ? error.message : 'Unknown error',
      'STEP_EXECUTION',
      undefined
    );
    
    const step = createTestStep(
      stepIndex,
      TestActionType.ACTION_FAILED,
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      screenshotPath
    );
    
    await appendToLog(logFilePath, step);
    
    return { shouldContinue: stateTracker.shouldContinue(), isComplete: false };
  }
}

async function logLlmDecision(
  stepIndex: number,
  llmResult: LLMResult,
  screenshotPath: string,
  logFilePath: string
): Promise<void> {
  const step = createTestStep(
    stepIndex,
    TestActionType.LLM_DECISION,
    `Planned action: ${llmResult.nextAction}`,
    screenshotPath,
    llmResult.element 
      ? `${llmResult.element.type} "${llmResult.element.name}"`
      : undefined
  );
  
  await appendToLog(logFilePath, step);
}

async function logTestComplete(
  stepIndex: number,
  screenshotPath: string,
  logFilePath: string
): Promise<void> {
  console.log('Test sequence complete');
  
  const step = createTestStep(
    stepIndex,
    TestActionType.TEST_COMPLETE,
    'Success - All actions completed',
    screenshotPath
  );
  
  await appendToLog(logFilePath, step);
}

async function executeAction(
  driver: Browser,
  stepIndex: number,
  llmResult: LLMResult,
  screenshotPath: string,
  logFilePath: string,
  stateTracker: TestStateTracker
): Promise<boolean> {
  try {
    if (llmResult.element) {
      const { type, name } = llmResult.element;
      const elementInfo: ElementInfo = { 
        name, 
        type,
        isInput: type === 'type'
      };
      
      const element = await findElement(driver, elementInfo);

      if (!element) {
        const errorMessage = `Could not find element: ${name}`;
        stateTracker.recordFailure(errorMessage, 'FIND_ELEMENT', name);
        
        const step = createTestStep(
          stepIndex,
          TestActionType.ACTION_FAILED,
          errorMessage,
          screenshotPath,
          `${type} "${name}"`
        );
        
        await appendToLog(logFilePath, step);
        return stateTracker.shouldContinue();
      }

      if (type === 'tap') {
        await tapElement(driver, element);
        
        const step = createTestStep(
          stepIndex,
          TestActionType.TAP,
          'Success',
          screenshotPath,
          `"${name}"`
        );
        
        await appendToLog(logFilePath, step);
        stateTracker.recordSuccess(`Tapped element: ${name}`);
      } else if (type === 'type') {
        await typeIntoElement(driver, element, llmResult.text || '');
        
        const step = createTestStep(
          stepIndex,
          TestActionType.TYPE,
          'Success',
          screenshotPath,
          `"${name}" text: "${llmResult.text}"`
        );
        
        await appendToLog(logFilePath, step);
        stateTracker.recordSuccess(`Typed into element: ${name}`);
      } else if (type === 'verify') {
        // Handle verification
        const verifyResult = await verifyElement(driver, element, llmResult.text);
        
        let resultMessage = '';
        if (verifyResult.success) {
          if (llmResult.text) {
            resultMessage = verifyResult.matches 
              ? `Verification passed: Found "${verifyResult.actualText}"`
              : `Verification failed: Expected "${llmResult.text}" but found "${verifyResult.actualText}"`;
          } else {
            resultMessage = `Verification: Element contains "${verifyResult.actualText}"`;
          }
        } else {
          resultMessage = 'Verification failed: Could not get element text';
        }
        
        const step = createTestStep(
          stepIndex,
          TestActionType.VERIFY,
          resultMessage,
          screenshotPath,
          `"${name}"`
        );
        
        await appendToLog(logFilePath, step);
        
        // Only count as success if verification was successful
        if (verifyResult.success && (!llmResult.text || verifyResult.matches)) {
          stateTracker.recordSuccess(`Verified element: ${name}`);
        } else {
          stateTracker.recordFailure(resultMessage, 'VERIFICATION', name);
        }
      }
      // Add more action types here as needed (swipe, scroll, etc.)
    } else {
      const step = createTestStep(
        stepIndex,
        TestActionType.NO_ACTION,
        'No actionable element found',
        screenshotPath
      );
      
      await appendToLog(logFilePath, step);
      stateTracker.recordFailure('No actionable element found', 'NO_ACTION');
    }
    
    return true;
  } catch (error) {
    console.error('Action execution error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    stateTracker.recordFailure(
      errorMessage,
      'ACTION_EXECUTION',
      llmResult.element?.name
    );
    
    const step = createTestStep(
      stepIndex,
      TestActionType.ACTION_FAILED,
      `Error: ${errorMessage}`,
      screenshotPath,
      llmResult.element 
        ? `${llmResult.element.type} "${llmResult.element.name}"`
        : undefined
    );
    
    await appendToLog(logFilePath, step);

    // If this is a critical error, we should stop regardless of consecutive failures
    if (error instanceof CriticalTestError) {
      return false;
    }
    
    return stateTracker.shouldContinue();
  }
}

