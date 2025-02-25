// src/web/handlers/test-results-handler.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { getResultsDir, determineTestStatus } from '../../utils/file-manager';
import { renderTestResultsPage } from '../views/test-results-view';
import { TestStatus } from '../../types/test-types';

interface TestResultRow {
  Timestamp: string;
  Step: string;
  Action: string;
  'Element Info': string;
  Result: string;
  Screenshot: string;
}

export async function testResultsHandler(req: Request, res: Response): Promise<void> {
  const testId = req.params.testName;
  const testDir = path.join(getResultsDir(), testId);
  const logFilePath = path.join(testDir, 'test_log.tsv');
  
  // Check if auto-refresh is requested
  const autoRefresh = req.query.autoRefresh === 'true';
  
  try {
    // Determine the test status
    const testStatus = await determineTestStatus(testId);
    
    // Read the test results
    const testResults = await readTestResults(logFilePath);
    
    // Get the original prompt
    const prompt = await getTestPrompt(testId);
    
    // Render the page
    const html = renderTestResultsPage(testId, testResults, testStatus, prompt || 'Unknown', autoRefresh);
    res.send(html);
  } catch (error) {
    console.error('Error reading test results:', error);
    res.status(500).send('Error reading test results.');
  }
}

async function readTestResults(logFilePath: string): Promise<TestResultRow[]> {
  return new Promise((resolve, reject) => {
    const results: TestResultRow[] = [];
    
    fs.createReadStream(logFilePath)
      .pipe(csv({ separator: '\t' }))
      .on('data', (row: TestResultRow) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Helper function to get the original test prompt
async function getTestPrompt(testId: string): Promise<string | null> {
  try {
    const testDir = path.join(getResultsDir(), testId);
    const logFilePath = path.join(testDir, 'test_log.tsv');
    
    return new Promise((resolve, reject) => {
      let prompt: string | null = null;
      
      fs.createReadStream(logFilePath)
        .pipe(csv({ separator: '\t' }))
        .on('data', (row: TestResultRow) => {
          if (row.Action === 'TEST_START' && row.Result.startsWith('Test prompt:')) {
            prompt = row.Result.substring('Test prompt:'.length).trim();
          }
        })
        .on('end', () => resolve(prompt))
        .on('error', reject);
    });
  } catch (error) {
    console.error(`Error getting prompt for test ${testId}:`, error);
    return null;
  }
}
