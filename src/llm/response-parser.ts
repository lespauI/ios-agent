// src/llm/response-parser.ts
import { LLMResult } from '../types/llm-types';

/**
 * Parses and validates the raw response from the LLM
 * 
 * @param rawText The raw text response from the LLM
 * @returns A validated LLMResult object
 */
export async function parseResponse(rawText: string): Promise<LLMResult> {
  try {
    // Clean up the response if it contains markdown code blocks
    const cleanedText = cleanMarkdown(rawText);
    console.log('Cleaned response:', cleanedText);
    
    // Parse the JSON response
    const result: LLMResult = JSON.parse(cleanedText);
    
    // Validate the response structure
    validateResponse(result);
    
    return result;
  } catch (parseError) {
    console.error('JSON parsing error:', parseError);
    console.error('Attempted to parse:', rawText);
    throw new Error(`Failed to parse LLM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

/**
 * Cleans markdown formatting from the LLM response
 * 
 * @param text The raw text that may contain markdown
 * @returns Cleaned text with markdown removed
 */
function cleanMarkdown(text: string): string {
  if (text.startsWith('```')) {
    // Remove starting ```json or ``` and ending ```
    return text
      .replace(/^```(?:json)?[\r\n]/, '')  // Remove starting ```json or ```
      .replace(/[\r\n]```$/, '')           // Remove ending ```
      .trim();
  }
  
  return text;
}

/**
 * Validates that the parsed response has the required structure
 * 
 * @param result The parsed LLM result
 * @throws Error if the response is invalid
 */
function validateResponse(result: LLMResult): void {
    if (!result.nextAction) {
      throw new Error('Incomplete JSON structure in LLM response: missing nextAction field');
    }
    
    // If there's an element, validate its structure
    if (result.element) {
      const { type, name, x, y } = result.element;
      
      // Update the valid types check to include 'verify'
      const validTypes = ['tap', 'type', 'verify', 'swipe', 'scroll'];
      if (!type || !validTypes.includes(type)) {
        throw new Error(`Invalid element type: ${type}. Must be one of: ${validTypes.join(', ')}`);
      }
      
      if (!name) {
        throw new Error('Element name is required');
      }
      
      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('Element coordinates must be numbers');
      }
      
      // If it's a type action, text should be provided
      if (type === 'type' && !result.text) {
        console.warn('Warning: Type action specified but no text provided');
      }
    }
  }
