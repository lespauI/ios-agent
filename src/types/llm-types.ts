// src/types/llm-types.ts

import { AppContext } from './device-types';

/**
 * Result returned from the LLM after analyzing the app state
 */
export interface LLMResult {
  nextAction: string;
  element?: {
    type: 'tap' | 'type' | 'verify' | 'swipe' | 'scroll';  
    name: string;
    x: number;
    y: number;
  };
  text?: string;
  confidence?: number;
  reasoning?: string;
}

/**
 * Interface for LLM service implementations
 */
export interface LLMService {
  callLLM(
    userPrompt: string,
    pageSource: string,
    screenshotPath: string
  ): Promise<LLMResult>;
}

/**
 * Function type for calling the LLM
 */
export type LLMCaller = (
  prompt: string,
  screenshotPath: string,
  context: AppContext
) => Promise<LLMResult>;

/**
 * Configuration options for LLM services
 */
export interface LLMConfig {
  model: string;
  temperature: number;
  apiKey?: string;
  maxTokens?: number;
  useVision?: boolean;
}

/**
 * Represents a message in a conversation with the LLM
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: { url: string };
  }>;
}
