// src/web/handlers/home-handler.ts
import { Request, Response } from 'express';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { getResultsDir, determineTestStatus } from '../../utils/file-manager';
import { renderHomePage } from '../views/home-view';
import { TestStatus } from '../../types/test-types';

export async function homePageHandler(req: Request, res: Response): Promise<void> {
  try {
    const resultsDir = getResultsDir();
    const testIds = await listTestResults(resultsDir);
    
    // Get status and prompt for each test
    const testInfoPromises = testIds.map(async (testId) => {
      const status = await determineTestStatus(testId);
      const prompt = await getTestPrompt(testId);
      
      return {
        id: testId,
        status,
        prompt: prompt || undefined
      };
    });
    
    const tests = await Promise.all(testInfoPromises);
    
    // Sort tests: Running first, then by ID (most recent first)
    tests.sort((a, b) => {
      // Running tests first
      if (a.status === TestStatus.RUNNING && b.status !== TestStatus.RUNNING) return -1;
      if (a.status !== TestStatus.RUNNING && b.status === TestStatus.RUNNING) return 1;
      

      return b.id.localeCompare(a.id);
    });
    
    const html = renderHomePage(tests);
    res.send(html);
  } catch (error) {
    console.error('Error rendering home page:', error);
    res.status(500).send('Error loading test results');
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
