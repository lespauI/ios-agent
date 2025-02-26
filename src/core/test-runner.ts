// src/core/test-runner.ts
import { Browser } from 'webdriverio';
import path from 'path';
import { LLMResult } from '../types/llm-types';
import { TestStep, TestActionType } from '../types/test-types';
import { findElement, ElementInfo } from '../device/element-finder';
import { tapElement, typeIntoElement, bypassPopups, tapByCoordinates, typeAtCoordinates } from '../device/actions';
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
  console.log(`\\n--- Step ${stepIndex} ---`);
  
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
    
    // Get the action history for context
    const actionHistory = stateTracker.getRecentActionsContext();
    
    // Determine if we should use vision based on previous failures
    const useVision = failureState.consecutiveFailures > 0;
    
    // Call the LLM with the appropriate mode
    const llmResult = await llmService.callLLM(
      userPrompt,
      pageSource,
      screenshotPath,
      actionHistory,
      stateInfo,
      useVision
    );

    // Log whether vision was used
    const visionInfo = llmResult.usedVision ? ' (using vision)' : ' (using XML)';
    console.log(`LLM decision${visionInfo}: ${llmResult.nextAction}`);

    // Create a test step for logging
    const llmDecisionStep = createTestStep(
      stepIndex,
      TestActionType.LLM_DECISION,
      `Planned action${visionInfo}: ${llmResult.nextAction}`,
      screenshotPath,
      llmResult.element 
        ? `${llmResult.element.type} "${llmResult.element.name}"`
        : undefined
    );
    
    await appendToLog(logFilePath, llmDecisionStep);
    
    // Record the LLM decision in the state tracker
    stateTracker.recordSuccess({
      step: stepIndex,
      action: TestActionType.LLM_DECISION,
      elementInfo: llmResult.element 
        ? `${llmResult.element.type} "${llmResult.element.name}"`
        : undefined,
      result: `Planned action${visionInfo}: ${llmResult.nextAction}`,
      timestamp: new Date().toISOString()
    });

    if (llmResult.nextAction === 'DONE') {
      // Create a test complete step
      const completeStep = createTestStep(
        stepIndex,
        TestActionType.TEST_COMPLETE,
        'Success - All actions completed',
        screenshotPath
      );
      
      await appendToLog(logFilePath, completeStep);
      
      // Record the completion in the state tracker
      stateTracker.recordSuccess({
        step: stepIndex,
        action: TestActionType.TEST_COMPLETE,
        result: 'Success - All actions completed',
        timestamp: new Date().toISOString()
      });
      
      console.log('Test sequence complete');
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
      const { type, name, x, y } = llmResult.element;
      const elementInfo: ElementInfo = { 
        name, 
        type,
        isInput: type === 'type',
        x,
        y
      };
      
      const element = await findElement(driver, elementInfo);

      if (!element) {
        // If we couldn't find the element but have coordinates, try direct tap/type at coordinates
        if (x !== undefined && y !== undefined) {
          console.log(`Attempting direct interaction at coordinates (${x}, ${y})`);
          
          if (type === 'tap') {
            // Use the fixed tap method
            const success = await tapByCoordinates(driver, x, y);
            
            if (success) {
              await driver.pause(1000);
              
              const step = createTestStep(
                stepIndex,
                TestActionType.TAP,
                'Success (using coordinates)',
                screenshotPath,
                `"${name}" at (${x}, ${y})`
              );
              
              await appendToLog(logFilePath, step);
              
              // Record the success in the state tracker
              stateTracker.recordSuccess({
                step: stepIndex,
                action: TestActionType.TAP,
                elementInfo: `"${name}" at (${x}, ${y})`,
                result: 'Success (using coordinates)',
                timestamp: new Date().toISOString()
              });
              
              return true;
            } else {
              // Tap failed
              const errorMessage = `Failed to tap at coordinates (${x}, ${y})`;
              const shouldContinue = stateTracker.recordFailure(errorMessage, 'TAP_COORDINATES', name);
              
              const step = createTestStep(
                stepIndex,
                TestActionType.ACTION_FAILED,
                errorMessage,
                screenshotPath,
                `${type} "${name}" at (${x}, ${y})`
              );
              
              await appendToLog(logFilePath, step);
              return shouldContinue;
            }
          } else if (type === 'type') {
            // For type actions, use the new typeAtCoordinates function
            try {
              // First tap at coordinates
              const tapSuccess = await tapByCoordinates(driver, x, y);
              
              if (!tapSuccess) {
                const errorMessage = `Failed to tap at coordinates (${x}, ${y}) before typing`;
                const shouldContinue = stateTracker.recordFailure(errorMessage, 'TAP_BEFORE_TYPE', name);
                
                const step = createTestStep(
                  stepIndex,
                  TestActionType.ACTION_FAILED,
                  errorMessage,
                  screenshotPath,
                  `${type} "${name}" at (${x}, ${y})`
                );
                
                await appendToLog(logFilePath, step);
                return shouldContinue;
              }
              
              await driver.pause(500);
              
              // Use setValue instead of keys
              try {
                const textFields = await driver.$$('XCUIElementTypeTextField, XCUIElementTypeSecureTextField, XCUIElementTypeTextView');
                let foundTextField = false;

                for (const field of textFields) {
                  try {
                    const isVisible = await field.isDisplayed();
                    if (isVisible) {
                      await field.setValue(llmResult.text || '');
                      foundTextField = true;
                      break;
                    }
                  } catch (fieldError) {
                    // Continue to next field
                  }
                }
              
      
              if (!foundTextField) {
                  // If no text field found, try using the active element
                  await driver.execute('mobile: type', {
                    text: llmResult.text || ''
                  });
                }
                
                await driver.pause(500);
                
                const step = createTestStep(
                  stepIndex,
                  TestActionType.TYPE,
                  'Success (using coordinates)',
                  screenshotPath,
                  `"${name}" at (${x}, ${y}) text: "${llmResult.text}"`
                );
                
                await appendToLog(logFilePath, step);
                
                // Record the success in the state tracker
                stateTracker.recordSuccess({
                  step: stepIndex,
                  action: TestActionType.TYPE,
                  elementInfo: `"${name}" at (${x}, ${y}) text: "${llmResult.text}"`,
                  result: 'Success (using coordinates)',
                  timestamp: new Date().toISOString()
                });
                
                return true;
              } catch (typeError) {
                // Sending keys failed
                const errorMessage = `Failed to type text after tapping at coordinates (${x}, ${y}): ${typeError instanceof Error ? typeError.message : 'Unknown error'}`;
                const shouldContinue = stateTracker.recordFailure(errorMessage, 'TYPE_COORDINATES', name);
                
                const step = createTestStep(
                  stepIndex,
                  TestActionType.ACTION_FAILED,
                  errorMessage,
                  screenshotPath,
                  `${type} "${name}" at (${x}, ${y})`
                );
                
                await appendToLog(logFilePath, step);
                return shouldContinue;
              }
            } catch (error) {
              const errorMessage = `Failed to interact at coordinates (${x}, ${y}): ${error instanceof Error ? error.message : 'Unknown error'}`;
              const shouldContinue = stateTracker.recordFailure(errorMessage, 'COORDINATE_INTERACTION', name);
              
              const step = createTestStep(
                stepIndex,
                TestActionType.ACTION_FAILED,
                errorMessage,
                screenshotPath,
                `${type} "${name}" at (${x}, ${y})`
              );
              
              await appendToLog(logFilePath, step);
              return shouldContinue;
            }
          } else if (type === 'verify') {
            // For verify actions, we can't do much with just coordinates
            const errorMessage = `Cannot verify element at coordinates (${x}, ${y}) without finding the element`;
            const shouldContinue = stateTracker.recordFailure(errorMessage, 'VERIFY_COORDINATES', name);
            
            const step = createTestStep(
              stepIndex,
              TestActionType.ACTION_FAILED,
              errorMessage,
              screenshotPath,
              `${type} "${name}" at (${x}, ${y})`
            );
            
            await appendToLog(logFilePath, step);
            return shouldContinue;
          }
        }
        
        // If we still couldn't interact or don't have coordinates, record a failure
        const errorMessage = `Could not find element: ${name}`;
        const shouldContinue = stateTracker.recordFailure(errorMessage, 'FIND_ELEMENT', name);
        
        const step = createTestStep(
          stepIndex,
          TestActionType.ACTION_FAILED,
          errorMessage,
          screenshotPath,
          `${type} "${name}"`
        );
        
        await appendToLog(logFilePath, step);
        return shouldContinue;
      }

      // We found the element, now interact with it
      if (type === 'tap') {
        try {
          await tapElement(driver, element);
          
          const step = createTestStep(
            stepIndex,
            TestActionType.TAP,
            'Success',
            screenshotPath,
            `"${name}"`
          );
          
          await appendToLog(logFilePath, step);
          
          // Record the success in the state tracker
          stateTracker.recordSuccess({
            step: stepIndex,
            action: TestActionType.TAP,
            elementInfo: `"${name}"`,
            result: 'Success',
            timestamp: new Date().toISOString()
          });
          
          return true;
        } catch (tapError) {
          // Element tap failed
          const errorMessage = `Failed to tap element: ${tapError instanceof Error ? tapError.message : 'Unknown error'}`;
          const shouldContinue = stateTracker.recordFailure(errorMessage, 'TAP_ELEMENT', name);
          
          const step = createTestStep(
            stepIndex,
            TestActionType.ACTION_FAILED,
            errorMessage,
            screenshotPath,
            `${type} "${name}"`
          );
          
          await appendToLog(logFilePath, step);
          return shouldContinue;
        }
      } else if (type === 'type') {
        try {
          await typeIntoElement(driver, element, llmResult.text || '');
          
          const step = createTestStep(
            stepIndex,
            TestActionType.TYPE,
            'Success',
            screenshotPath,
            `"${name}" text: "${llmResult.text}"`
          );
          
          await appendToLog(logFilePath, step);
          
          // Record the success in the state tracker
          stateTracker.recordSuccess({
            step: stepIndex,
            action: TestActionType.TYPE,
            elementInfo: `"${name}" text: "${llmResult.text}"`,
            result: 'Success',
            timestamp: new Date().toISOString()
          });
          
          return true;
        } catch (typeError) {
          // Element type failed
          const errorMessage = `Failed to type into element: ${typeError instanceof Error ? typeError.message : 'Unknown error'}`;
          const shouldContinue = stateTracker.recordFailure(errorMessage, 'TYPE_ELEMENT', name);
          
          const step = createTestStep(
            stepIndex,
            TestActionType.ACTION_FAILED,
            errorMessage,
            screenshotPath,
            `${type} "${name}"`
          );
          
          await appendToLog(logFilePath, step);
          return shouldContinue;
        }
      } else if (type === 'verify') {
        try {
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
            stateTracker.recordSuccess({
              step: stepIndex,
              action: TestActionType.VERIFY,
              elementInfo: `"${name}"`,
              result: resultMessage,
              timestamp: new Date().toISOString()
            });
            return true;
          } else {
            const shouldContinue = stateTracker.recordFailure(resultMessage, 'VERIFICATION', name);
            return shouldContinue;
          }
        } catch (verifyError) {
          // Verification failed
          const errorMessage = `Failed to verify element: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`;
          const shouldContinue = stateTracker.recordFailure(errorMessage, 'VERIFY_ELEMENT', name);
          
          const step = createTestStep(
            stepIndex,
            TestActionType.ACTION_FAILED,
            errorMessage,
            screenshotPath,
            `${type} "${name}"`
          );
          
          await appendToLog(logFilePath, step);
          return shouldContinue;
        }
      }
      // Add more action types here as needed (swipe, scroll, etc.)
    }
    
    // No element provided
    const step = createTestStep(
      stepIndex,
      TestActionType.NO_ACTION,
      'No actionable element found',
      screenshotPath
    );
    
    await appendToLog(logFilePath, step);
    const shouldContinue = stateTracker.recordFailure('No actionable element found', 'NO_ACTION');
    return shouldContinue;
  } catch (error) {
    console.error('Action execution error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const shouldContinue = stateTracker.recordFailure(
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
    
    return shouldContinue;
  }
}

async function logLlmDecision(
  stepIndex: number,
  llmResult: LLMResult,
  screenshotPath: string,
  logFilePath: string,
  visionInfo: string = ''
): Promise<void> {
  const step = createTestStep(
    stepIndex,
    TestActionType.LLM_DECISION,
    `Planned action${visionInfo}: ${llmResult.nextAction}`,
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
