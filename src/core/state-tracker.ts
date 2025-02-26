// src/core/state-tracker.ts
// Enhance the state tracker to maintain test context without XML accumulation

import { TestActionType, TestStatus } from '../types/test-types';

export interface FailureTracker {
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
  lastFailureReason?: string;
  lastFailedAction?: string;
  failedElements: Set<string>;
}

export interface TestAction {
  step: number;
  action: TestActionType;
  elementInfo?: string;
  result: string;
  timestamp: string;
}

/**
 * Manages the state of the test execution including failure tracking
 * and maintains a history of actions without storing XML
 */
export class TestStateTracker {
  private failureTracker: FailureTracker;
  private visitedScreens: Set<string> = new Set();
  private completedActions: TestAction[] = [];
  private startTime: number;
  private currentStep: number = 0;

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
   * @param action The action that was performed
   */
  public recordSuccess(action: TestAction): void {
    // Reset consecutive failures counter on success
    this.failureTracker.consecutiveFailures = 0;
    this.completedActions.push(action);
    this.currentStep = Math.max(this.currentStep, action.step);
  }

/**
   * Records a failed action
   * @param reason Reason for the failure
   * @param action The action that failed
   * @param elementName Optional name of the element that failed
   * @returns true if the test should continue, false if it should stop
   */
public recordFailure(reason: string, actionType: string, elementName?: string): boolean {
    this.failureTracker.consecutiveFailures++;
    this.failureTracker.lastFailureReason = reason;
    this.failureTracker.lastFailedAction = actionType;
    
    if (elementName) {
      this.failureTracker.failedElements.add(elementName);
    }
    
    console.log(`Failure recorded. Consecutive failures: ${this.failureTracker.consecutiveFailures}/${this.failureTracker.maxConsecutiveFailures}`);
    
    // Check if we've reached the maximum consecutive failures
    return this.failureTracker.consecutiveFailures < this.failureTracker.maxConsecutiveFailures;
  }

  /**
   * Checks if the test should continue based on failure state
   */
  public shouldContinue(): boolean {
    const shouldContinue = this.failureTracker.consecutiveFailures < this.failureTracker.maxConsecutiveFailures;
    if (!shouldContinue) {
      console.log(`Test should stop: ${this.failureTracker.consecutiveFailures} consecutive failures reached the limit of ${this.failureTracker.maxConsecutiveFailures}`);
    }
    return shouldContinue;
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
   * Gets the current step number
   */
  public getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * Increments the step counter
   */
  public incrementStep(): number {
    return ++this.currentStep;
  }

  /**
   * Gets a summary of recent actions for context
   * @param maxActions Maximum number of recent actions to include
   */
  public getRecentActionsContext(maxActions: number = 5): string {
    if (this.completedActions.length === 0) {
      return "No actions performed yet.";
    }
    
    // Get the most recent actions
    const recentActions = this.completedActions
      .slice(-maxActions)
      .map(action => {
        return `Step ${action.step}: ${action.action}${action.elementInfo ? ` on "${action.elementInfo}"` : ''} - ${action.result}`;
      })
      .join('\n');
    
    return `Recent actions:\n${recentActions}`;
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
    currentStep: number;
  } {
    return {
      consecutiveFailures: this.failureTracker.consecutiveFailures,
      totalCompletedActions: this.completedActions.length,
      uniqueScreensVisited: this.visitedScreens.size,
      testDuration: this.getTestDuration(),
      lastFailureReason: this.failureTracker.lastFailureReason,
      currentStep: this.currentStep
    };
  }
}
