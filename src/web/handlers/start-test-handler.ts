// src/web/handlers/start-test-handler.ts
import { Request, Response } from 'express';
import { runTestSequence } from '../../core/agent';
import { renderStartTestPage, renderTestStartedPage } from '../views/start-test-view';

export function startTestPageHandler(req: Request, res: Response): void {
  const html = renderStartTestPage();
  res.send(html);
}

export async function startTestHandler(req: Request, res: Response): Promise<void> {
  const prompt = req.body.prompt;
  
  if (!prompt) {
    res.status(400).send('Prompt is required.');
    return;
  }

  try {
    // Start the test and get the test ID
    const testId = await runTestSequence(prompt);
    
    // Redirect to the results page for this test
    res.redirect(`/results/${testId}?autoRefresh=true`);
  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).send(`Error starting test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
