// src/web/handlers/home-handler.ts
import { Request, Response } from 'express';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { getResultsDir, determineTestStatus } from '../../utils/file-manager';
import { renderHomePage } from '../views/home-view';
import { TestStatus } from '../../types/test-types';
import { getBaseHtml } from '../views/base-view';


export async function homePageHandler(req: Request, res: Response): Promise<void> {
    try {
      const resultsDir = getResultsDir();
      
      // Make sure the results directory exists
      try {
        await fsPromises.access(resultsDir); // Use fsPromises.access
      } catch (accessError) {
        // Create the directory if it doesn't exist
        await fsPromises.mkdir(resultsDir, { recursive: true });
      }
      
      const testIds = await listTestResults(resultsDir);
      
      // Get status and prompt for each test
      const testInfoPromises = testIds.map(async (testId) => {
        try {
          const status = await determineTestStatus(testId);
          const prompt = await getTestPrompt(testId);
          
          return {
            id: testId,
            status,
            prompt: prompt || undefined
          };
        } catch (error) {
          console.error(`Error getting info for test ${testId}:`, error);
          // Return a basic object with default values
          return {
            id: testId,
            status: TestStatus.COMPLETED,
            prompt: undefined
          };
        }
      });
      
      const tests = await Promise.all(testInfoPromises);
      
      // Sort tests: Running first, then by ID (most recent first)
      tests.sort((a, b) => {
        // Running tests first
        if (a.status === TestStatus.RUNNING && b.status !== TestStatus.RUNNING) return -1;
        if (a.status !== TestStatus.RUNNING && b.status === TestStatus.RUNNING) return 1;
        
        // Then by ID (most recent first - assuming IDs contain timestamps)
        return b.id.localeCompare(a.id);
      });
      
      const html = renderHomePage(tests);
      res.send(html);
    } catch (error) {
      console.error('Error rendering home page:', error);
      
      // Send a user-friendly error page
      const errorHtml = `
        <h1>Error Loading Test Results</h1>
        <p>There was an error loading the test results.</p>
        <p>Error details: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p><a href="/start">Start a New Test</a></p>
      `;
      res.status(500).send(getBaseHtml('Error', errorHtml));
    }
  }
  

async function listTestResults(resultsDir: string): Promise<string[]> {
  try {
    return await fsPromises.readdir(resultsDir);
  } catch (error) {
    console.error('Error reading results directory:', error);
    return [];
  }
}

async function getTestPrompt(testId: string): Promise<string | null> {
  try {
    const testDir = path.join(getResultsDir(), testId);
    const logFilePath = path.join(testDir, 'test_log.tsv');
    
    const data = await fsPromises.readFile(logFilePath, 'utf8');
    const lines = data.split('\n');
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split('\t');
      if (fields.length >= 5 && fields[2] === 'TEST_START') {
        // Extract prompt from the result field
        const result = fields[4];
        const promptMatch = result.match(/Test prompt: (.+)/);
        if (promptMatch && promptMatch[1]) {
          return promptMatch[1];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving prompt for test ${testId}:`, error);
    return null;
  }
}
