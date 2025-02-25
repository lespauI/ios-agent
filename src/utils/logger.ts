// src/utils/logger.ts
import fs from 'fs/promises';
import path from 'path';
import { TestStep } from '../types/test-types';

export async function initializeLogFile(logFilePath: string): Promise<void> {
  const headers = [
    'Timestamp',
    'Step',
    'Action',
    'Element Info',
    'Result',
    'Screenshot'
  ].join('\t') + '\n';
  
  await fs.writeFile(logFilePath, headers, 'utf8');
}

export async function appendToLog(logFilePath: string, step: TestStep): Promise<void> {
  const logLine = [
    step.timestamp,
    step.step,
    step.elementInfo || 'N/A',
    step.action,
    step.result,
    path.basename(step.screenshotPath)
  ].join('\t') + '\n';

  await fs.appendFile(logFilePath, logLine, 'utf8');
}

export function createTestStep(
  step: number,
  action: string,
  result: string,
  screenshotPath: string,
  elementInfo?: string
): TestStep {
  return {
    timestamp: new Date().toISOString(),
    step,
    action,
    elementInfo,
    result,
    screenshotPath
  };
}