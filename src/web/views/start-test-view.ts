// src/web/views/start-test-view.ts
import { getBaseHtml } from './base-view';

export function renderStartTestPage(): string {
  const content = `
    <div class="container">
      <h1>Start a New iOS Test</h1>
      <div class="card">
        <form method="POST" action="/start">
          <div class="form-group">
            <label for="prompt">Test Instructions:</label>
            <textarea id="prompt" name="prompt" placeholder="Enter detailed test instructions..." required rows="4"></textarea>
            <p class="hint">Describe what you want to test in natural language. For example: "Login with username 'testuser' and password 'password123', then verify the dashboard shows the user's name."</p>
          </div>
          <button type="submit" class="button primary-button">Start Test</button>
        </form>
      </div>
      
      <div class="examples">
        <h2>Example Test Instructions</h2>
        <ul>
          <li>"Sign up as a new user with email test@example.com and password Test123!"</li>
          <li>"Search for 'running shoes', add the first item to cart, and proceed to checkout"</li>
          <li>"Navigate to settings, enable dark mode, then return to the home screen"</li>
        </ul>
      </div>
      
      <p><a href="/">Back to Test Results</a></p>
    </div>
  `;
  
  return getBaseHtml('Start New Test', content);
}

export function renderTestStartedPage(prompt: string): string {
  const content = `
    <div class="container">
      <h1>Test Started</h1>
      <div class="card">
        <p>Your test has been started with the following instructions:</p>
        <div class="prompt-box">
          <p><strong>${prompt}</strong></p>
        </div>
        
        <p>The test is now running in the background. You will be redirected to the results page shortly.</p>
        <p>If you are not redirected automatically, <a href="/">click here to view all tests</a>.</p>
        
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Running test...</p>
        </div>
      </div>
    </div>
    
    <script>
      // Redirect to home page after 3 seconds
      setTimeout(function() {
        window.location.href = "/";
      }, 3000);
    </script>
  `;
  
  return getBaseHtml('Test Started', content);
}
