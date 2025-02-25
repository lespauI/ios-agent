// src/web/server.ts
import express from 'express';
import path from 'path';
import { setupRoutes } from './routes';
import { config } from '../config/environment';

export function startServer(port: number = config.server.port): void {
  const app = express();
  
  // Configure middleware
  app.use(express.urlencoded({ extended: true }));
  
  // Serve static files
  app.use('/results', express.static(path.join(__dirname, '..', '..', 'results')));
  
  // Setup routes
  setupRoutes(app);
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
