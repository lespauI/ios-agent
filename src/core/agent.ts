// src/core/agent.ts
import path from 'path';
import { TestConfig } from '../types/test-types';
import { createDriver, closeDriver } from '../device/driver-manager';
import { executeTestStep } from './test-runner';
import { createTestDirectories } from '../utils/file-manager';
import { initializeLogFile, appendToLog, createTestStep } from '../utils/logger';
import { OpenAiLLM } from '../llm/openai-llm';
import { TestStateTracker } from './state-tracker';
import { TestActionType } from '../types/test-types';

// src/core/agent.ts
// Add these imports and update the runTestSequence function

import { TestStatus } from '../types/test-types';
import { updateTestStatus } from '../utils/file-manager';




// Default configuration
const defaultConfig: TestConfig = {
  maxSteps: 10,
  screenshotDir: path.join(__dirname, '..', '..', 'screenshots'),
  logFilePath: path.join(__dirname, '..', '..', 'logs', 'test_log.tsv'),
  capabilities: {
    platformName: 'iOS',
    platformVersion: '18.0',
    deviceName: 'iPhone 16 Pro',
    automationName: 'XCUITest',
    noReset: true,
    app: process.env.APP_PATH || '',
  }
};

export async function runTestSequence(
  userPrompt: string,
  config: Partial<TestConfig> = {}
): Promise<string> {  // Return the testId
  // Merge default config with provided config
  const testConfig: TestConfig = { ...defaultConfig, ...config };
  
  // Create directories for test results
  const { testId, testDir, screenshotsDir, logFilePath } = await createTestDirectories(
    path.join(__dirname, '..', '..')
  );
  
  // Initialize log file
  await initializeLogFile(logFilePath);
  
  // Initialize state tracker with max 3 consecutive failures
  const stateTracker = new TestStateTracker(3);
  
  // Log test start
  const startStep = createTestStep(
    0,
    TestActionType.TEST_START,
    `Test prompt: ${userPrompt}`,
    'N/A'
  );
  await appendToLog(logFilePath, startStep);

  // Set test status to RUNNING
  updateTestStatus(testId, TestStatus.RUNNING);

  // Start the test in a separate async process
  (async () => {
    try {
      // Initialize WebdriverIO
      const driver = await createDriver(testConfig);

      try {
        // Initialize LLM service
        const llmService = new OpenAiLLM();
        
        // Execute test steps
        for (let stepIndex = 1; stepIndex <= testConfig.maxSteps; stepIndex++) {
          const { shouldContinue, isComplete } = await executeTestStep(
            driver,
            stepIndex,
            userPrompt,
            screenshotsDir,
            logFilePath,
            llmService,
            stateTracker
          );
          
          if (isComplete) {
            // Test completed successfully
            updateTestStatus(testId, TestStatus.COMPLETED);
            break;
          }
          
          if (!shouldContinue) {
            // Test failed or was stopped
            const failureState = stateTracker.getFailureState();
            console.error(`Test stopped after ${failureState.consecutiveFailures} consecutive failures.`);
            
            const failureStep = createTestStep(
              stepIndex,
              TestActionType.TEST_FAILED,
              `Test stopped after ${failureState.consecutiveFailures} consecutive failures: ${failureState.lastFailureReason || 'Unknown reason'}`,
              'N/A'
            );
            await appendToLog(logFilePath, failureStep);
            
            updateTestStatus(testId, TestStatus.FAILED);
            break;
          }
          
          await driver.pause(1000);
        }
      } catch (error) {
        console.error('Test sequence error:', error);
        
        const errorStep = createTestStep(
          -1,
          TestActionType.TEST_FAILED,
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'N/A'
        );
        await appendToLog(logFilePath, errorStep);
        
        updateTestStatus(testId, TestStatus.FAILED);
      } finally {
        // Log test end with state summary
        const stateSummary = stateTracker.getStateSummary();
        
        const endStep = createTestStep(
          -1,
          TestActionType.TEST_END,
          `Test session completed. Duration: ${stateSummary.testDuration}ms, Actions: ${stateSummary.totalCompletedActions}, Screens: ${stateSummary.uniqueScreensVisited}`,
          'N/A'
        );
        await appendToLog(logFilePath, endStep);
        
        // Close WebdriverIO session
        await closeDriver(driver);
        console.log('Test sequence ended');
      }
    } catch (error) {
      console.error('Failed to initialize WebdriverIO:', error);
      updateTestStatus(testId, TestStatus.FAILED);
    }
  })();
  
  // Return the test ID immediately
  return testId;
}
