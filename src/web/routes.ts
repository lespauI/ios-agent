// src/web/routes.ts
import { Express } from 'express';
import { homePageHandler } from './handlers/home-handler';
import { startTestPageHandler, startTestHandler } from './handlers/start-test-handler';
import { restartTestHandler } from './handlers/restart-test-handler';
import { testResultsHandler } from './handlers/test-results-handler';
import { testStatusApiHandler } from './handlers/api-handler';

export function setupRoutes(app: Express): void {
  // Web UI routes
  app.get('/', homePageHandler);
  app.get('/start', startTestPageHandler);
  app.post('/start', startTestHandler);
  app.post('/restart/:testName', restartTestHandler);
  app.get('/results/:testName', testResultsHandler);
  
  // API routes
  app.get('/api/test/:testId/status', testStatusApiHandler);
}
