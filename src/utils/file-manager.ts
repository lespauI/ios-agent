// src/utils/file-manager.ts
import fs from 'fs/promises';
import path from 'path';
import { TestStatus } from '../types/test-types';

// Add this to track active tests and their status
const activeTests = new Map<string, TestStatus>();

/**
 * Gets the base directory for test results
 */
export function getResultsDir(): string {
  return path.join(__dirname, '..', '..', 'results');
}

/**
 * Creates directories for a new test run
 */
export async function createTestDirectories(baseDir: string): Promise<{
  testId: string;
  testDir: string;
  screenshotsDir: string;
  logFilePath: string;
}> {
  const timeStamp = Date.now().toString();
  const testId = `run_${timeStamp}`;
  const testDir = path.join(baseDir, 'results', testId);
  const screenshotsDir = path.join(testDir, 'screenshots');
  const logFilePath = path.join(testDir, 'test_log.tsv');

  await fs.mkdir(screenshotsDir, { recursive: true });
  
  // Set the test status to RUNNING
  activeTests.set(testId, TestStatus.RUNNING);
  
  return {
    testId,
    testDir,
    screenshotsDir,
    logFilePath
  };
}

/**
 * Gets the path for a screenshot file
 * This function was missing from the export
 */
export function getScreenshotPath(screenshotsDir: string, stepIndex: number): string {
  return path.join(screenshotsDir, `step_${stepIndex}.png`);
}

/**
 * Updates the status of a test
 */
export function updateTestStatus(testId: string, status: TestStatus): void {
  activeTests.set(testId, status);
}

/**
 * Gets the status of a test
 */
export function getTestStatus(testId: string): TestStatus {
  return activeTests.get(testId) || TestStatus.COMPLETED; // Default to COMPLETED for old tests
}

/**
 * Gets all test statuses
 */
export function getAllTestStatuses(): Map<string, TestStatus> {
  return new Map(activeTests);
}

/**
 * Determines the test status from log file
 */
export async function determineTestStatus(testId: string): Promise<TestStatus> {
  // If we already have it in memory, return that
  if (activeTests.has(testId)) {
    return activeTests.get(testId)!;
  }
  
  try {
    const testDir = path.join(getResultsDir(), testId);
    const logFilePath = path.join(testDir, 'test_log.tsv');
    
    const data = await fs.readFile(logFilePath, 'utf8');
    const lines = data.split('\n');
    
    // Check if the test has ended
    const hasTestEnd = lines.some(line => line.includes('TEST_END'));
    const hasTestFailed = lines.some(line => line.includes('TEST_FAILED'));
    
    if (hasTestFailed) {
      activeTests.set(testId, TestStatus.FAILED);
      return TestStatus.FAILED;
    } else if (hasTestEnd) {
      activeTests.set(testId, TestStatus.COMPLETED);
      return TestStatus.COMPLETED;
    } else {
      // If the log file exists but doesn't have TEST_END, it's still running
      activeTests.set(testId, TestStatus.RUNNING);
      return TestStatus.RUNNING;
    }
  } catch (error) {
    console.error(`Error determining test status for ${testId}:`, error);
    // If we can't read the file, assume it's completed (old test)
    return TestStatus.COMPLETED;
  }
}

/**
 * Retrieves the original prompt used for a test
 * 
 * @param testId The name of the test
 * @returns The original prompt or null if not found
 */
export async function getTestPrompt(testId: string): Promise<string | null> {
  try {
    const testDir = path.join(getResultsDir(), testId);
    const logFilePath = path.join(testDir, 'test_log.tsv');
    
    // Read the first few lines of the log file to find the TEST_START entry
    const data = await fs.readFile(logFilePath, 'utf8');
    const lines = data.split('\n');
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split('\t');
      if (fields.length >= 5 && fields[2] === 'TEST_START') {
        // Extract prompt from the result field
        const result = fields[4];
        const promptMatch = result.match(/Test prompt: (.+)/);
        if (promptMatch && promptMatch[1]) {
          return promptMatch[1];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving prompt for test ${testId}:`, error);
    return null;
  }
}
