// src/llm/openai-llm.ts
import OpenAI from 'openai';
import { LLMResult, LLMService } from '../types/llm-types';
import { createPrompt } from './prompt-templates';
import { parseResponse } from './response-parser';

export class OpenAiLLM implements LLMService {
  private client: OpenAI;
  private model: string = 'gpt-4o';
  private temperature: number = 0.7;

  constructor(apiKey?: string, model?: string, temperature?: number) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
    
    if (model) this.model = model;
    if (temperature !== undefined) this.temperature = temperature;
  }

  public async callLLM(
    userPrompt: string,
    pageSource: string,
    screenshotPath: string,
    stateInfo?: {
      consecutiveFailures: number;
      lastFailureReason?: string;
      failedElements: string[];
    }
  ): Promise<LLMResult> {
    try {
        // Get the formatted prompt from the prompt template
        const message = createPrompt(userPrompt, pageSource, stateInfo);
        
        // Call OpenAI API
        const response = await this.makeOpenAIRequest(message);
        
        // Parse and validate the response
        return await parseResponse(response);
      } catch (error) {
        console.error('Error in OpenAI LLM service:', error);
        return {
          nextAction: `Error: ${error instanceof Error ? error.message : 'Unable to process LLM response.'}`,
          element: undefined
        };
      }
    }

  private async makeOpenAIRequest(message: string): Promise<string> {
    const chatCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that helps parse iOS app screenshots for automated testing. Track test progress and indicate completion clearly.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: this.temperature,
    });

    const rawText = chatCompletion.choices[0]?.message?.content?.trim() || '';
    console.log('Raw LLM response:', rawText); // Debug log
    
    return rawText;
  }
}
