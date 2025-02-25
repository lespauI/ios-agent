// src/types/test-types.ts

/**
 * Represents a single step in a test execution
 */
export interface TestStep {
  timestamp: string;
  step: number;
  action: string;
  elementInfo?: string;
  result: string;
  screenshotPath: string;
  duration?: number;
}

/**
 * Configuration for a test run
 */
export interface TestConfig {
  maxSteps: number;
  screenshotDir: string;
  logFilePath: string;
  capabilities: {
    platformName: string;
    platformVersion: string;
    deviceName: string;
    automationName: string;
    noReset: boolean;
    app: string;
  };
}

/**
 * Summary of a test execution
 */
export interface TestSummary {
  testId: string;
  startTime: string;
  endTime: string;
  duration: number;
  prompt: string;
  steps: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Status of a test execution
 */
export enum TestStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABORTED = 'aborted'
}

/**
 * Action types that can be performed during a test
 */
export enum TestActionType {
  TEST_START = 'TEST_START',
  LLM_DECISION = 'LLM_DECISION',
  TAP = 'TAP',
  TYPE = 'TYPE',
  VERIFY = 'VERIFY',  // Add this line
  SWIPE = 'SWIPE',
  SCROLL = 'SCROLL',
  WAIT = 'WAIT',
  NO_ACTION = 'NO_ACTION',
  ACTION_FAILED = 'ACTION_FAILED',
  TEST_COMPLETE = 'TEST_COMPLETE',
  TEST_FAILED = 'TEST_FAILED',
  TEST_END = 'TEST_END'
}

/**
 * Represents a test case
 */
export interface TestCase {
  id: string;
  name: string;
  prompt: string;
  maxSteps?: number;
  timeout?: number;
  expectedOutcome?: string;
}

/**
 * Represents a FailureTracker
 */

export interface FailureTracker {
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
  lastFailureReason?: string;
  lastFailedAction?: string;
  failedElements: Set<string>;
}



