// src/llm/llm-service.ts
import { LLMResult, LLMService } from '../types/llm-types';
export { LLMResult, LLMService }; 

/**
 * Abstract base class for LLM services
 * This allows for easy swapping between different LLM providers
 */
export abstract class BaseLLMService implements LLMService {
  /**
   * Calls the LLM with the given prompt and context
   * 
   * @param userPrompt The user's test instructions
   * @param pageSource The XML hierarchy of the current screen
   * @param screenshotPath The path to the screenshot file
   * @returns A promise resolving to the LLM's response
   */
  abstract callLLM(
    userPrompt: string,
    pageSource: string,
    screenshotPath: string
  ): Promise<LLMResult>;
  
  /**
   * Creates a new instance of the LLM service with the given configuration
   * 
   * @param config Configuration options for the LLM service
   * @returns A new instance of the LLM service
   */
  abstract withConfig(config: Record<string, any>): LLMService;
}
