// src/web/views/home-view.ts
import { getBaseHtml } from './base-view';
import { TestStatus } from '../../types/test-types';

interface TestInfo {
  id: string;
  status: TestStatus;
  prompt?: string;
}

export function renderHomePage(tests: TestInfo[]): string {
  const content = `
    <h1>iOS AI Test Results</h1>
    
    <div class="actions">
      <a href="/start" class="button primary-button">Start a New Test</a>
    </div>
    
    <div class="card">
      <h2>Recent Tests</h2>
      ${tests.length > 0 ? renderTestsTable(tests) : '<p>No tests found. Start a new test to see results here.</p>'}
    </div>
  `;
  
  return getBaseHtml('iOS AI Test Results', content);
}

function renderTestsTable(tests: TestInfo[]): string {
  return `
    <table id="testsTable">
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Status</th>
          <th>Prompt</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tests.map(test => `
          <tr>
            <td><a href="/results/${test.id}">${test.id}</a></td>
            <td>${getStatusBadge(test.status)}</td>
            <td>${test.prompt || 'N/A'}</td>
            <td>
              <a href="/results/${test.id}" class="button">View Results</a>
              ${test.status !== TestStatus.RUNNING ? 
                `<form action="/restart/${test.id}" method="post" style="display:inline;">
                  <button type="submit" class="button restart-button">Restart</button>
                </form>` : 
                ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getStatusBadge(status: TestStatus): string {
  switch (status) {
    case TestStatus.RUNNING:
      return '<span class="badge badge-running">In Progress</span>';
    case TestStatus.COMPLETED:
      return '<span class="badge badge-completed">Completed</span>';
    case TestStatus.FAILED:
      return '<span class="badge badge-failed">Failed</span>';
    default:
      return '';
  }
}
