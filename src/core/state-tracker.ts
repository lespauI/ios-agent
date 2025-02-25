// src/core/state-tracker.ts
import { FailureTracker } from '../types/test-types';

/**
 * Manages the state of the test execution including failure tracking
 */
export class TestStateTracker {
  private failureTracker: FailureTracker;
  private visitedScreens: Set<string> = new Set();
  private completedActions: string[] = [];
  private startTime: number;

  constructor(maxConsecutiveFailures: number = 3) {
    this.failureTracker = {
      consecutiveFailures: 0,
      maxConsecutiveFailures,
      failedElements: new Set<string>()
    };
    this.startTime = Date.now();
  }

  /**
   * Records a successful action
   * @param actionDescription Description of the successful action
   */
  public recordSuccess(actionDescription: string): void {
    // Reset consecutive failures counter on success
    this.failureTracker.consecutiveFailures = 0;
    this.completedActions.push(actionDescription);
  }

  /**
   * Records a failed action
   * @param reason Reason for the failure
   * @param action The action that failed
   * @param elementName Optional name of the element that failed
   * @returns true if the test should continue, false if it should stop
   */
  public recordFailure(reason: string, action: string, elementName?: string): boolean {
    this.failureTracker.consecutiveFailures++;
    this.failureTracker.lastFailureReason = reason;
    this.failureTracker.lastFailedAction = action;
    
    if (elementName) {
      this.failureTracker.failedElements.add(elementName);
    }
    
    // Check if we've reached the maximum consecutive failures
    return this.failureTracker.consecutiveFailures < this.failureTracker.maxConsecutiveFailures;
  }

  /**
   * Checks if the test should continue based on failure state
   */
  public shouldContinue(): boolean {
    return this.failureTracker.consecutiveFailures < this.failureTracker.maxConsecutiveFailures;
  }

  /**
   * Gets the current failure state
   */
  public getFailureState(): FailureTracker {
    return { ...this.failureTracker };
  }

  /**
   * Records a visited screen to track navigation
   * @param screenIdentifier Unique identifier for the screen
   */
  public recordVisitedScreen(screenIdentifier: string): void {
    this.visitedScreens.add(screenIdentifier);
  }

  /**
   * Checks if a screen has been visited before
   * @param screenIdentifier Unique identifier for the screen
   */
  public hasVisitedScreen(screenIdentifier: string): boolean {
    return this.visitedScreens.has(screenIdentifier);
  }

  /**
   * Gets the test duration in milliseconds
   */
  public getTestDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Gets a summary of the test state
   */
  public getStateSummary(): {
    consecutiveFailures: number;
    totalCompletedActions: number;
    uniqueScreensVisited: number;
    testDuration: number;
    lastFailureReason?: string;
  } {
    return {
      consecutiveFailures: this.failureTracker.consecutiveFailures,
      totalCompletedActions: this.completedActions.length,
      uniqueScreensVisited: this.visitedScreens.size,
      testDuration: this.getTestDuration(),
      lastFailureReason: this.failureTracker.lastFailureReason
    };
  }
}
