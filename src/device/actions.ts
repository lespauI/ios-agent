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

/**
 * Taps at specific coordinates on the screen
 * 
 * @param driver WebdriverIO Browser instance
 * @param x X coordinate
 * @param y Y coordinate
 * @returns True if successful, false otherwise
 */
export async function tapByCoordinates(
  driver: Browser,
  x: number,
  y: number
): Promise<boolean> {
  try {
    // Try using mobile: tap command which is more reliable for iOS
    await driver.executeScript('mobile: tap', [{
      x: x,
      y: y
    }]);
    console.log(`Successfully tapped at coordinates (${x}, ${y})`);
    return true;
  } catch (error) {
    console.error(`Error tapping at coordinates (${x}, ${y}):`, error);
    
    try {
      // Fallback: Try to find an element at those coordinates
      const elem = await driver.executeScript('mobile: findElementByCoordinates', [x, y]);
      
      if (elem) {
        await elem.click();
        console.log(`Successfully tapped element found at coordinates (${x}, ${y})`);
        return true;
      }
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
    }
    
    return false;
  }
}

/**
 * Types text after tapping at specific coordinates
 * 
 * @param driver WebdriverIO Browser instance
 * @param x X coordinate
 * @param y Y coordinate
 * @param text Text to type
 * @returns True if successful, false otherwise
 */
export async function typeAtCoordinates(
  driver: Browser,
  x: number,
  y: number,
  text: string
): Promise<boolean> {
  try {
    // First tap at the coordinates
    const tapSuccess = await tapByCoordinates(driver, x, y);
    if (!tapSuccess) {
      return false;
    }
    
    await driver.pause(500);
    
    // Try to type using the mobile: type command
    try {
      await driver.executeScript('mobile: type', [text]);
      console.log(`Successfully typed "${text}" at coordinates (${x}, ${y})`);
      return true;
    } catch (typeError) {
      console.error('Error typing text:', typeError);
      
      // Fallback: Try to send keys directly
      try {
        await driver.keys(text.split(''));
        console.log(`Successfully typed "${text}" using keys`);
        return true;
      } catch (keysError) {
        console.error('Error sending keys:', keysError);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error in typeAtCoordinates (${x}, ${y}):`, error);
    return false;
  }
}




