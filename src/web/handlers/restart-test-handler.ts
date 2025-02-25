// src/web/handlers/restart-test-handler.ts
import { Request, Response } from 'express';
import { runTestSequence } from '../../core/agent';
import { getTestPrompt } from '../../utils/file-manager';

export async function restartTestHandler(req: Request, res: Response): Promise<void> {
  const testId = req.params.testName;
  
  try {
    // Get the original prompt for this test
    const prompt = await getTestPrompt(testId);
    
    if (!prompt) {
      res.status(404).send(`Could not find original prompt for test: ${testId}`);
      return;
    }
    
    // Start a new test with the original prompt
    const newTestId = await runTestSequence(prompt);
    
    // Redirect to the new test results page
    res.redirect(`/results/${newTestId}?autoRefresh=true`);
  } catch (error) {
    console.error(`Error restarting test ${testId}:`, error);
    res.status(500).send(`Error restarting test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
