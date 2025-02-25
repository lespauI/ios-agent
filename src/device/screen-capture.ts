// src/device/screen-capture.ts

import { Browser } from 'webdriverio';
import fs from 'fs/promises';
import path from 'path';

export async function captureScreenshot(
  driver: Browser,
  screenshotPath: string
): Promise<void> {
  const screenshot = await driver.takeScreenshot();
  await fs.writeFile(screenshotPath, Buffer.from(screenshot, 'base64'));
}

export async function getPageSource(driver: Browser): Promise<string> {
  return await driver.getPageSource();
}