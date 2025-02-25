// src/types/error-types.ts

/**
 * Base class for all custom errors in the application
 */
export class AppError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AppError';
    }
  }
  
  /**
   * Error thrown when an element cannot be found
   */
  export class ElementNotFoundError extends AppError {
    constructor(elementName: string) {
      super(`Element not found: ${elementName}`);
      this.name = 'ElementNotFoundError';
    }
  }
  
  /**
   * Error thrown when the LLM returns an invalid response
   */
  export class LLMResponseError extends AppError {
    constructor(message: string) {
      super(`LLM response error: ${message}`);
      this.name = 'LLMResponseError';
    }
  }
  
  /**
   * Error thrown when a test step fails
   */
  export class TestStepError extends AppError {
    constructor(step: number, action: string, message: string) {
      super(`Test step ${step} (${action}) failed: ${message}`);
      this.name = 'TestStepError';
    }
  }
  
  /**
   * Error thrown when a critical test failure occurs
   */
  export class CriticalTestError extends AppError {
    constructor(message: string) {
      super(`Critical test error: ${message}`);
      this.name = 'CriticalTestError';
    }
  }
  
  /**
   * Error thrown when device interaction fails
   */
  export class DeviceInteractionError extends AppError {
    constructor(action: string, message: string) {
      super(`Device interaction error (${action}): ${message}`);
      this.name = 'DeviceInteractionError';
    }
  }
  