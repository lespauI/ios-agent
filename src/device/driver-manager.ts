// src/device/driver-manager.ts
import { remote, Browser } from 'webdriverio';
import { TestConfig } from '../types/test-types';

export async function createDriver(config: TestConfig): Promise<Browser> {
  return await remote({
    path: '/wd/hub',
    port: 4723,
    capabilities: {
      platformName: config.capabilities.platformName,
      'appium:platformVersion': config.capabilities.platformVersion,
      'appium:deviceName': config.capabilities.deviceName,
      'appium:automationName': config.capabilities.automationName,
      'appium:noReset': config.capabilities.noReset,
      'appium:app': config.capabilities.app,
    },
  });
}

export async function closeDriver(driver: Browser): Promise<void> {
  await driver.deleteSession();
}