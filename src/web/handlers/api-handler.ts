// src/web/handlers/api-handlers.ts
import { Request, Response } from 'express';
import { determineTestStatus } from '../../utils/file-manager';

export async function testStatusApiHandler(req: Request, res: Response): Promise<void> {
  const testId = req.params.testId;
  
  try {
    const status = await determineTestStatus(testId);
    res.json({ 
      testId, 
      status,
      isRunning: status === 'running'
    });
  } catch (error) {
    console.error(`Error getting status for test ${testId}:`, error);
    res.status(500).json({ error: 'Failed to get test status' });
  }
}
