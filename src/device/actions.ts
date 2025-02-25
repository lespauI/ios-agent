// src/device/actions.ts
import { Browser, ChainablePromiseElement } from 'webdriverio';

export async function tapElement(
  driver: Browser,
  element: ChainablePromiseElement
): Promise<void> {
  await element.click();
  await driver.pause(1000);
}

export async function typeIntoElement(
  driver: Browser,
  element: ChainablePromiseElement,
  text: string
): Promise<void> {
  await element.click();
  await driver.pause(500);
  await element.setValue(text);
  await driver.pause(500);
}

/**
 * Checks for and handles any system alerts/popups
 * 
 * @param driver WebdriverIO Browser instance
 * @returns True if an alert was handled, false otherwise
 */
export async function bypassPopups(driver: Browser): Promise<boolean> {
  try {
    // First check if an alert exists using a safer method
    const alertExists = await checkIfAlertExists(driver);
    
    if (!alertExists) {
      return false;
    }
    
    // If we confirmed an alert exists, get its text and accept it
    const alertText = await driver.getAlertText();
    console.log(`System alert detected with text: "${alertText}"`);
    await driver.acceptAlert();
    console.log('Alert accepted');
    return true;
  } catch (error) {
    // Don't log the error, just return false
    return false;
  }
}

/**
 * Safely checks if an alert is present without throwing errors
 * 
 * @param driver WebdriverIO Browser instance
 * @returns True if an alert exists, false otherwise
 */
async function checkIfAlertExists(driver: Browser): Promise<boolean> {
  try {
    // Use executeScript to check for an alert without throwing an error
    const alertPresent = await driver.execute(() => {
      // @ts-ignore - window.alert is available in the browser context
      return window.alert !== undefined && window.alert !== null;
    });
    
    return !!alertPresent;
  } catch (error) {
    // If there's an error checking, assume no alert
    return false;
  }
}

/**
 * Verifies text content of an element
 * 
 * @param driver WebdriverIO Browser instance
 * @param element Element to verify
 * @param expectedText Text to verify (optional)
 * @returns Object containing verification result and actual text
 */
export async function verifyElement(
  driver: Browser,
  element: ChainablePromiseElement,
  expectedText?: string
): Promise<{ success: boolean; actualText: string; matches: boolean }> {
  try {
    // Get the text from the element
    let actualText = '';
    
    try {
      // Try to get text using the getText method
      actualText = await element.getText();
    } catch (error) {
      // If getText fails, try to get the name attribute
      actualText = await element.getAttribute('name') || '';
    }
    
    // If no expected text was provided, just return the actual text
    if (!expectedText) {
      return { 
        success: true, 
        actualText, 
        matches: true 
      };
    }
    
    // Check if the actual text matches the expected text
    // Use a case-insensitive comparison and trim whitespace
    const matches = actualText.trim().toLowerCase() === expectedText.trim().toLowerCase();
    
    return {
      success: true,
      actualText,
      matches
    };
  } catch (error) {
    console.error('Error verifying element:', error);
    return {
      success: false,
      actualText: '',
      matches: false
    };
  }
}
