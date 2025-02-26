export function createPrompt(
  userPrompt: string,
  pageSource: string,
  actionHistory: string,
  stateInfo?: {
    consecutiveFailures: number;
    lastFailureReason?: string;
    failedElements: string[];
  }
): string {
  let stateContext = "";

  if (stateInfo && stateInfo.consecutiveFailures > 0) {
    stateContext = `
  Current test state:
  - There have been ${stateInfo.consecutiveFailures} consecutive failed attempts
  - Last failure reason: ${stateInfo.lastFailureReason || "Unknown"}
  - Elements that failed: ${stateInfo.failedElements.join(", ") || "None"}
  
  Please try a different approach to make progress. If you've been trying to interact with a specific element that's failing, consider alternative elements or paths.
  `;
  }

  return `
  User wants to: ${userPrompt}
  
  ${actionHistory}
  
  ${stateContext}
  
  Current screen XML hierarchy:
  ${pageSource}
  
  Based on the XML hierarchy and the history of actions so far, tell me:
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
 * Creates a vision-enabled prompt that includes the screenshot, current XML, and action history
 */
export function createVisionPrompt(
  userPrompt: string,
  pageSource: string,
  imageUrl: string,
  actionHistory: string,
  stateInfo?: {
    consecutiveFailures: number;
    lastFailureReason?: string;
    failedElements: string[];
  }
): Array<{
  role: "user" | "system" | "assistant";
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}> {
  let stateContext = "";

  if (stateInfo && stateInfo.consecutiveFailures > 0) {
    stateContext = `
  Current test state:
  - There have been ${stateInfo.consecutiveFailures} consecutive failed attempts
  - Last failure reason: ${stateInfo.lastFailureReason || "Unknown"}
  - Elements that failed: ${stateInfo.failedElements.join(", ") || "None"}
  
  Please try a different approach based on the visual appearance of the app. Look for buttons, text fields, and other UI elements that might help complete the task.
  `;
  }

  return [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `User wants to: ${userPrompt}
  
  ${actionHistory}
  
  ${stateContext}
  
  I'm providing a screenshot of the current screen. Please analyze it visually to identify UI elements.`,
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        },
      ],
    },
    {
      role: "user",
      content: `Here's the XML hierarchy of the same screen:
  ${pageSource}
  
  Based on the screenshot, XML hierarchy, and the history of actions so far, tell me:
  1. What should be the next action?
  2. Which element should we interact with? (provide exact coordinates)
  3. If typing is needed, what text should be entered?
  
  Important Guidelines:
  - If all required actions from "${userPrompt}" are completed, respond with "nextAction": "DONE"
  - If you can't find the required element in the XML, use the visual information from the screenshot
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
  `,
    },
  ];
}
