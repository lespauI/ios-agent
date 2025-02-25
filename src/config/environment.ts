// src/config/environment.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost'
  },
  test: {
    maxSteps: parseInt(process.env.MAX_TEST_STEPS || '10', 10),
    resultsDir: process.env.RESULTS_DIR || path.join(__dirname, '..', '..', 'results')
  },
  device: {
    platformName: process.env.PLATFORM_NAME || 'iOS',
    platformVersion: process.env.PLATFORM_VERSION || '18.0',
    deviceName: process.env.DEVICE_NAME || 'iPhone 16 Pro',
    automationName: process.env.AUTOMATION_NAME || 'XCUITest',
    noReset: process.env.NO_RESET !== 'false',
    appPath: process.env.APP_PATH || ''
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL || 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY || '',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
  }
};
