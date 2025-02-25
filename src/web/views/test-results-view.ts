// src/web/views/test-results-view.ts (enhanced with AJAX)
import { getBaseHtml } from './base-view';
import { TestStatus } from '../../types/test-types';

interface TestResultRow {
  Timestamp: string;
  Step: string;
  Action: string;
  'Element Info': string;
  Result: string;
  Screenshot: string;
}

export function renderTestResultsPage(
  testId: string, 
  results: TestResultRow[], 
  status: TestStatus,
  prompt: string,
  autoRefresh: boolean = false
): string {
  // Status badge HTML
  const statusBadge = getStatusBadge(status);
  
  // Don't use meta refresh, we'll use JavaScript instead
  const extraHead = autoRefresh && status === TestStatus.RUNNING 
    ? '' // We'll use AJAX instead of meta refresh
    : '';
  
  const content = `
    <h1>Test: ${testId} <span id="status-badge">${statusBadge}</span></h1>
    <div class="test-info">
      <p><strong>Prompt:</strong> ${prompt}</p>
      <p><strong>Status:</strong> <span id="status-text">${status}</span></p>
      <p><strong>Steps:</strong> <span id="steps-count">${results.length}</span></p>
      ${status === TestStatus.RUNNING ? 
        '<div class="refresh-status">Auto-refreshing results... <div class="spinner-small"></div></div>' : ''}
    </div>
    <div class="actions">
      <a href="/" class="button">Back to Test Results</a>
      ${status === TestStatus.RUNNING 
        ? `<button id="toggle-refresh" class="button refresh-button">${autoRefresh ? 'Disable' : 'Enable'} Auto Refresh</button>` 
        : ''}
      ${status === TestStatus.COMPLETED || status === TestStatus.FAILED 
        ? `<form action="/restart/${testId}" method="post" style="display:inline;">
             <button type="submit" class="button restart-button">Restart Test</button>
           </form>` 
        : ''}
    </div>
    
    <div id="results-container">
      <table id="resultsTable">
        <thead>
          <tr>
            <th onclick="sortTable(0)">Timestamp</th>
            <th onclick="sortTable(1)">Step</th>
            <th onclick="sortTable(2)">Action</th>
            <th onclick="sortTable(3)">Element Info</th>
            <th onclick="sortTable(4)">Result</th>
            <th>Screenshot</th>
          </tr>
        </thead>
        <tbody id="results-body">
          ${renderTestResultsRows(testId, results)}
        </tbody>
      </table>
    </div>
    
    <script>
      // Table sorting function
      function sortTable(n) {
        var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
        table = document.getElementById("resultsTable");
        switching = true;
        dir = "asc";
        while (switching) {
          switching = false;
          rows = table.rows;
          for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            if (dir == "asc") {
              if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                shouldSwitch = true;
                break;
              }
            } else if (dir == "desc") {
              if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                shouldSwitch = true;
                break;
              }
            }
          }
          if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
          } else {
            if (switchcount == 0 && dir == "asc") {
              dir = "desc";
              switching = true;
            }
          }
        }
      }
      
      // Auto-refresh functionality
      let autoRefreshEnabled = ${autoRefresh ? 'true' : 'false'};
      let refreshInterval;
      
      function startAutoRefresh() {
        if (!autoRefreshEnabled) return;
        
        refreshInterval = setInterval(() => {
          checkTestStatus();
        }, 3000); // Check every 3 seconds
      }
      
      function stopAutoRefresh() {
        clearInterval(refreshInterval);
      }
      
      function toggleAutoRefresh() {
        autoRefreshEnabled = !autoRefreshEnabled;
        
        const button = document.getElementById('toggle-refresh');
        if (button) {
          button.textContent = autoRefreshEnabled ? 'Disable Auto Refresh' : 'Enable Auto Refresh';
        }
        
        if (autoRefreshEnabled) {
          startAutoRefresh();
          document.querySelector('.refresh-status').style.display = 'flex';
        } else {
          stopAutoRefresh();
          document.querySelector('.refresh-status').style.display = 'none';
        }
        
        // Update URL parameter
        const url = new URL(window.location.href);
        url.searchParams.set('autoRefresh', autoRefreshEnabled.toString());
        window.history.replaceState({}, '', url.toString());
      }
      
      async function checkTestStatus() {
        try {
          const response = await fetch('/api/test/${testId}/status');
          const data = await response.json();
          
          // Update status badge and text
          if (data.status !== '${status}') {
            // Status has changed, reload the page
            window.location.reload();
            return;
          }
          
          // If still running, refresh the results
          if (data.isRunning) {
            refreshResults();
          } else {
            // Test is no longer running, stop auto-refresh
            stopAutoRefresh();
            window.location.reload(); // Full reload to get final results
          }
        } catch (error) {
          console.error('Error checking test status:', error);
        }
      }
      
      async function refreshResults() {
        try {
          const response = await fetch('/results/${testId}');
          const html = await response.text();
          
          // Parse the HTML to extract just the results table body
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newResultsBody = doc.getElementById('results-body');
          const stepsCount = doc.getElementById('steps-count');
          
          if (newResultsBody) {
            document.getElementById('results-body').innerHTML = newResultsBody.innerHTML;
          }
          
          if (stepsCount) {
            document.getElementById('steps-count').textContent = stepsCount.textContent;
          }
        } catch (error) {
          console.error('Error refreshing results:', error);
        }
      }
      
      // Set up event listeners
      document.addEventListener('DOMContentLoaded', () => {
        const toggleButton = document.getElementById('toggle-refresh');
        if (toggleButton) {
          toggleButton.addEventListener('click', toggleAutoRefresh);
        }
        
        if (autoRefreshEnabled) {
          startAutoRefresh();
        }
      });
      
      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
      });
    </script>
  `;
  
  return getBaseHtml(`Test Results: ${testId}`, content, extraHead);
}

function renderTestResultsRows(testId: string, results: TestResultRow[]): string {
  return results.map(row => {
    // Add null checks for all properties
    const timestamp = row.Timestamp || '';
    const step = row.Step || '';
    const action = row.Action || '';
    const elementInfo = row['Element Info'] || '';
    const result = row.Result || '';
    const screenshot = row.Screenshot || '';
    
    // Add null check before calling toLowerCase
    const resultClass = result && result.toLowerCase().includes('error') ? 'error' : 
                       result && result.toLowerCase().includes('success') ? 'success' : '';
    
                       return `
                       <tr>
                         <td>${timestamp}</td>
                         <td>${step}</td>
                         <td>${action}</td>
                         <td>${elementInfo}</td>
                         <td class="${resultClass}">${result}</td>
                         <td>
                           ${screenshot !== 'N/A' 
                             ? `<img src="/results/${testId}/screenshots/${screenshot}" class="screenshot" onclick="showFullImage(this.src)" />`
                             : 'N/A'
                           }
                         </td>
                       </tr>
                     `;
                   }).join('');
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