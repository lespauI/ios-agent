// src/llm/openai-llm.ts
import OpenAI from 'openai';
import fs from 'fs/promises';
import { LLMResult, LLMService } from './llm-service';

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
    actionHistory: string,
    stateInfo?: {
      consecutiveFailures: number;
      lastFailureReason?: string;
      failedElements: string[];
    },
    useVision: boolean = false
  ): Promise<LLMResult> {
    try {
      // Truncate XML if it's too large
      const truncatedXML = this.truncateXML(pageSource, 50000);
      
      // Create a prompt
      let prompt = `
User wants to: ${userPrompt}

Action history:
${actionHistory}

Current screen XML hierarchy:
${truncatedXML}

Based on the XML hierarchy and action history, tell me:
1. What should be the next action?
2. Which element should we interact with?
3. If typing is needed, what text should be entered?

Respond in JSON format:
{
  "nextAction": "description of what needs to be done or DONE if test is complete",
  "element": {
    "type": "tap" or "type" or "verify",
    "name": "element name/label",
    "x": center X coordinate,
    "y": center Y coordinate
  },
  "text": "text to type or verify (if needed)"
}
`;

      // Add state info if available
      if (stateInfo && stateInfo.consecutiveFailures > 0) {
        prompt = `
Current test state:
- There have been ${stateInfo.consecutiveFailures} consecutive failed attempts
- Last failure reason: ${stateInfo.lastFailureReason || 'Unknown'}
- Elements that failed: ${stateInfo.failedElements.join(', ') || 'None'}

Please try a different approach.

${prompt}`;
      }

      // Call OpenAI API
      const chatCompletion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that helps with iOS app testing. Analyze XML hierarchies to determine the next action.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
      });

      const rawText = chatCompletion.choices[0]?.message?.content?.trim() || '';
      console.log('Raw LLM response:', rawText);
      
      // Parse the JSON response
      try {
        const cleanedText = this.cleanMarkdown(rawText);
        const result = JSON.parse(cleanedText) as LLMResult;
        result.usedVision = useVision;
        return result;
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        return {
          nextAction: `Error parsing LLM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          element: undefined
        };
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return {
        nextAction: `Error calling OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        element: undefined
      };
    }
  }

  private truncateXML(xml: string, maxLength: number): string {
    if (xml.length <= maxLength) {
      return xml;
    }
    
    return xml.substring(0, maxLength) + 
      '\n\n[XML truncated due to length. Showing first ' + maxLength + ' characters out of ' + xml.length + ']';
  }

  private cleanMarkdown(text: string): string {
    if (text.startsWith('```')) {
      // Remove starting ```json or ``` and ending ```
      return text
        .replace(/^```(?:json)?[\r\n]/, '')  // Remove starting ```json or ```
        .replace(/[\r\n]```$/, '')           // Remove ending ```
        .trim();
    }
    
    return text;
  }
}
