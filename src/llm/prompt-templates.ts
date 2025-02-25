// src/llm/prompt-templates.ts

/**
 * Creates a formatted prompt for the LLM based on the user's test instructions
 * and the current page source.
 * 
 * @param userPrompt The user's test instructions
 * @param pageSource The XML hierarchy of the current screen
 * @param stateInfo Optional information about the current test state
 * @returns A formatted prompt string
 */

export function createPrompt(
  userPrompt: string, 
  pageSource: string,
  stateInfo?: {
    consecutiveFailures: number;
    lastFailureReason?: string;
    failedElements: string[];
  }
): string {
  let stateContext = '';
  
  if (stateInfo && stateInfo.consecutiveFailures > 0) {
    stateContext = `
Current test state:
- There have been ${stateInfo.consecutiveFailures} consecutive failed attempts
- Last failure reason: ${stateInfo.lastFailureReason || 'Unknown'}
- Elements that failed: ${stateInfo.failedElements.join(', ') || 'None'}

Please try a different approach to make progress. If you've been trying to interact with a specific element that's failing, consider alternative elements or paths.
`;
  }

  return `
User wants to: ${userPrompt}

${stateContext}

Current screen XML hierarchy:
${pageSource}

Based on the XML hierarchy, tell me:
1. What should be the next action?
2. Which element should we interact with? (provide exact coordinates from the XML)
3. If typing is needed, what text should be entered?

Important Guidelines:
- If all required actions from "${userPrompt}" are completed, respond with "nextAction": "DONE"
- If you can't find the required element, explain why in nextAction
- Each step should progress towards completing the test goal
- If you need to verify text on screen without interacting, use type "verify"

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
}

  
  /**
   * Creates a vision-enabled prompt that includes both the screenshot and XML hierarchy
   * 
   * @param userPrompt The user's test instructions
   * @param pageSource The XML hierarchy of the current screen
   * @param screenshotUrl URL or base64 of the screenshot
   * @returns A formatted prompt object for vision models
   */
  export function createVisionPrompt(
    userPrompt: string, 
    pageSource: string,
    screenshotUrl: string
  ): Array<{type: string, text?: string, image_url?: {url: string}}> {
    return [
      {
        type: "text",
        text: `User wants to: ${userPrompt}\n\nBased on the screenshot and XML hierarchy, determine the next action to take.`
      },
      {
        type: "image_url",
        image_url: {
          url: screenshotUrl
        }
      },
      {
        type: "text",
        text: `Current screen XML hierarchy:\n${pageSource}\n\nRespond in JSON format:\n{\n  "nextAction": "description of what needs to be done or DONE if test is complete",\n  "element": {\n    "type": "tap" or "type",\n    "name": "element name/label",\n    "x": center X coordinate,\n    "y": center Y coordinate\n  },\n  "text": "text to type (if needed)"\n}`
      }
    ];
  }
  