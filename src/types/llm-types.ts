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
  usedVision?: boolean;
}

export interface LLMService {
  callLLM(
    userPrompt: string,
    pageSource: string,
    screenshotPath: string,
    actionHistory: string,
    stateInfo?: {
      consecutiveFailures: number;
      lastFailureReason?: string;
      failedElements: string[];
    },
    useVision?: boolean
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

export interface LLMService {
  callLLM(
    userPrompt: string,
    pageSource: string,
    screenshotPath: string,
    actionHistory: string,
    stateInfo?: {
      consecutiveFailures: number;
      lastFailureReason?: string;
      failedElements: string[];
    },
    useVision?: boolean
  ): Promise<LLMResult>;
}
