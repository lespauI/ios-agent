// src/index.ts
import { startServer } from './web/server';
import { config } from './config/environment';

// Ensure results directory exists
import fs from 'fs/promises';
import path from 'path';

async function ensureDirectoriesExist() {
  const resultsDir = path.join(__dirname, '..', 'results');
  
  try {
    await fs.mkdir(resultsDir, { recursive: true });
    console.log('Results directory created or already exists');
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

async function main() {
  await ensureDirectoriesExist();
  
  // Start the web server
  startServer(config.server.port);
  console.log(`Server started on port ${config.server.port}`);
}

main().catch(error => {
  console.error('Error starting application:', error);
  process.exit(1);
});
