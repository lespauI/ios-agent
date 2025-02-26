import { Browser, ChainablePromiseElement } from 'webdriverio';

export interface ElementInfo {
  name: string;
  type: string;
  isInput?: boolean;
  x?: number;  // Add coordinate support
  y?: number;  // Add coordinate support
}

export async function findElement(
  driver: Browser,
  elementInfo: ElementInfo
): Promise<ChainablePromiseElement | null> {
  try {
    // Special handling for input fields
    if (elementInfo.type === 'type' || elementInfo.isInput) {
      const element = await findInputElement(driver, elementInfo);
      if (element) return element;
    }

    // Regular element finding strategies
    const element = await findRegularElement(driver, elementInfo);
    if (element) return element;
    
    // If we have coordinates, try finding by coordinates as a last resort
    if (elementInfo.x !== undefined && elementInfo.y !== undefined) {
      console.log(`Trying to find element by coordinates (${elementInfo.x}, ${elementInfo.y})`);
      return await findElementByCoordinates(driver, elementInfo.x, elementInfo.y);
    }
    
    return null;
  } catch (error) {
    console.error('Error finding element:', error);
    return null;
  }
}

export async function findElementByCoordinates(
  driver: Browser,
  x: number,
  y: number
): Promise<ChainablePromiseElement | null> {
  try {
    // Get the element at the specified coordinates
    const element = await driver.executeScript(
      'return document.elementFromPoint(arguments[0], arguments[1]);',
      [x, y]
    );
    
    if (element) {
      console.log(`Found element at coordinates (${x}, ${y})`);
      return element;
    }

    // If the JavaScript approach doesn't work, try using WebdriverIO's touchAction
    // This is a fallback and might not work as expected in all cases
    const size = await driver.getWindowSize();
    const touchAction = {
      actions: [
        { action: 'press', x, y },
        { action: 'release' }
      ]
    };
    
    await driver.performActions([touchAction]);
    console.log(`Performed touch action at coordinates (${x}, ${y})`);
    
    // Return a dummy element since we can't get the actual element
    return null;
  } catch (error) {
    console.error(`Error finding element at coordinates (${x}, ${y}):`, error);
    return null;
  }
}

async function findInputElement(
  driver: Browser,
  elementInfo: ElementInfo
): Promise<ChainablePromiseElement | null> {
  // Try to find input field by associated label
  const xpath = [
    // Input field following a label with matching text
    `//XCUIElementTypeStaticText[@name="${elementInfo.name}"]/..//XCUIElementTypeTextField`,
    // Input with matching placeholder
    `//XCUIElementTypeTextField[@value="${elementInfo.name}"]`,
    // Input within a container near a label
    `//XCUIElementTypeStaticText[@name="${elementInfo.name}"]/following::XCUIElementTypeTextField[1]`,
    // Backup: any text field in the same form group
    `//XCUIElementTypeStaticText[@name="${elementInfo.name}"]//ancestor::XCUIElementTypeOther[1]//XCUIElementTypeTextField`,
    // Add more queries as needed
    `//XCUIElementTypeStaticText[@name="${elementInfo.name}"]/following::XCUIElementTypeSecureTextField`
  ];

  for (const query of xpath) {
    const element = await driver.$(query);
    if (await element.isExisting()) {
      console.log(`Found input field using query: ${query}`);
      return element;
    }
  }
  
  return null;
}

async function findRegularElement(
  driver: Browser,
  elementInfo: ElementInfo
): Promise<ChainablePromiseElement | null> {
  const queries = [
    // By accessibility ID
    {
      type: 'accessibility id',
      selector: elementInfo.name,
      query: async () => driver.$(`~${elementInfo.name}`)
    },
    // By XPath with multiple attributes
    {
      type: 'xpath',
      selector: `//${elementInfo.type}[@label="${elementInfo.name}" or @name="${elementInfo.name}" or @value="${elementInfo.name}"]`,
      query: async () => driver.$(`//${elementInfo.type}[@label="${elementInfo.name}" or @name="${elementInfo.name}" or @value="${elementInfo.name}"]`)
    },
    // By iOS predicate
    {
      type: 'ios predicate',
      selector: `label == "${elementInfo.name}" OR name == "${elementInfo.name}" OR value == "${elementInfo.name}"`,
      query: async () => driver.$(`-ios predicate string:${`label == "${elementInfo.name}" OR name == "${elementInfo.name}" OR value == "${elementInfo.name}"`}`)
    }
  ];

  for (const strategy of queries) {
    try {
      const element = await strategy.query();
      if (await element.isExisting()) {
        console.log(`Found element using ${strategy.type}: ${strategy.selector}`);
        return element;
      }
    } catch (error) {
      console.log(`Strategy ${strategy.type} failed:`, error);
    }
  }

  return null;
}