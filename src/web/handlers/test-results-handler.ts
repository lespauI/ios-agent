// src/web/handlers/test-results-handler.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs'; // Use this for promise-based fs functions
import csv from 'csv-parser';
import { getResultsDir, determineTestStatus, getTestPrompt } from '../../utils/file-manager';
import { renderTestResultsPage } from '../views/test-results-view';
import { TestStatus } from '../../types/test-types';
import { getBaseHtml } from '../views/base-view';

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
    // Check if the log file exists using fsPromises.access
    try {
      await fsPromises.access(logFilePath); // This is the corrected line
    } catch (accessError) {
      // Log file doesn't exist, show an error page
      const errorHtml = `
        <h1>Test Not Found</h1>
        <p>The test "${testId}" could not be found or has no log file.</p>
        <p><a href="/">Back to Test Results</a></p>
      `;
      res.status(404).send(getBaseHtml('Test Not Found', errorHtml));
      return;
    }
    
    // Determine the test status
    const testStatus = await determineTestStatus(testId);
    
    // Read the test results
    let testResults: TestResultRow[] = [];
    try {
      testResults = await readTestResults(logFilePath);
    } catch (readError) {
      console.error('Error reading test results:', readError);
      // Continue with empty results rather than failing
    }
    
    // Get the original prompt
    let prompt = 'Unknown';
    try {
      const retrievedPrompt = await getTestPrompt(testId);
      if (retrievedPrompt) {
        prompt = retrievedPrompt;
      }
    } catch (promptError) {
      console.error('Error retrieving prompt:', promptError);
    }
    
    // Render the page
    const html = renderTestResultsPage(testId, testResults, testStatus, prompt, autoRefresh);
    res.send(html);
  } catch (error) {
    console.error('Error reading test results:', error);
    
    // Send a user-friendly error page
    const errorHtml = `
      <h1>Error Loading Test Results</h1>
      <p>There was an error loading the results for test "${testId}".</p>
      <p>Error details: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p><a href="/">Back to Test Results</a></p>
    `;
    res.status(500).send(getBaseHtml('Error', errorHtml));
  }
}

async function readTestResults(logFilePath: string): Promise<TestResultRow[]> {
  return new Promise((resolve, reject) => {
    const results: TestResultRow[] = [];
    
    fs.createReadStream(logFilePath)
      .pipe(csv({ separator: '\t' }))
      .on('data', (row: TestResultRow) => {
        // Validate the row before adding it
        if (row && typeof row === 'object') {
          // Ensure all required properties exist (even if empty)
          const validatedRow: TestResultRow = {
            Timestamp: row.Timestamp || '',
            Step: row.Step || '',
            Action: row.Action || '',
            'Element Info': row['Element Info'] || '',
            Result: row.Result || '',
            Screenshot: row.Screenshot || ''
          };
          
          results.push(validatedRow);
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}
