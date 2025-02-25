// src/web/views/base-view.ts

export function getBaseHtml(title: string, content: string, extraHead: string = ''): string {
  return `
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${extraHead}
        <style>
          /* Base styles */
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0; 
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f7;
          }
          
          /* Container */
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          /* Card styling */
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            padding: 20px;
            margin-bottom: 20px;
          }
          
          /* Typography */
          h1, h2, h3 { 
            color: #1d1d1f;
            margin-top: 0;
          }
          
          /* Tables */
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-radius: 8px;
            overflow: hidden;
          }
          th, td { 
            padding: 12px 15px; 
            border-bottom: 1px solid #eee; 
            text-align: left; 
          }
          th { 
            background-color: #f8f8f8; 
            font-weight: 600;
            cursor: pointer;
            position: relative;
          }
          th:hover {
            background-color: #f1f1f1;
          }
          th:after {
            content: "↕";
            opacity: 0.3;
            margin-left: 5px;
          }
          
          /* Status badges */
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 10px;
          }
          .badge-running {
            background-color: #ffde59;
            color: #806600;
          }
          .badge-completed {
            background-color: #4cd964;
            color: #fff;
          }
          .badge-failed {
            background-color: #ff3b30;
            color: #fff;
          }
          
          /* Result colors */
          .success { color: #4cd964; }
          .error { color: #ff3b30; }
          
          /* Screenshots */
          .screenshot { 
            max-width: 200px; 
            max-height: 150px;
            border-radius: 4px;
            border: 1px solid #ddd;
            transition: transform 0.2s;
            cursor: pointer;
          }
          .screenshot:hover {
            transform: scale(1.5);
            z-index: 100;
          }
          
          /* Buttons and links */
          .button {
            display: inline-block;
            padding: 8px 16px;
            background-color: #0071e3;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            transition: background-color 0.2s;
            margin-right: 10px;
          }
          .button:hover {
            background-color: #0062c3;
            text-decoration: none;
          }
          .restart-button {
            background-color: #ff9500;
          }
          .restart-button:hover {
            background-color: #e68600;
          }
          .refresh-button {
            background-color: #5ac8fa;
          }
          .refresh-button:hover {
            background-color: #4ab8ea;
          }
          a {
            color: #0071e3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          
          /* Forms */
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }
          input[type="text"], textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            font-family: inherit;
          }
          textarea {
            resize: vertical;
            min-height: 100px;
          }
          .hint {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
          }
            /* Small spinner for inline use */
.spinner-small {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 2px solid #0071e3;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-left: 8px;
}

/* Refresh status indicator */
.refresh-status {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

/* Image modal for screenshots */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.8);
}
.modal-content {
  margin: auto;
  display: block;
  max-width: 90%;
  max-height: 90%;
}
.close {
  position: absolute;
  top: 15px;
  right: 35px;
  color: #f1f1f1;
  font-size: 40px;
  font-weight: bold;
  transition: 0.3s;
  cursor: pointer;
}

          
          /* Test info section */
          .test-info {
            background-color: #f8f8f8;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .test-info p {
            margin: 5px 0;
          }
          .prompt-box {
            background-color: #f8f8f8;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #0071e3;
          }
          
          /* Actions bar */
          .actions {
            margin: 20px 0;
            display: flex;
            align-items: center;
          }
          
          /* Loading spinner */
          .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 30px 0;
          }
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #0071e3;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Examples section */
          .examples {
            margin-top: 30px;
          }
          .examples ul {
            padding-left: 20px;
          }
          .examples li {
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
        </div>
        <div id="imageModal" class="modal">
  <span class="close" onclick="closeModal()">&times;</span>
  <img class="modal-content" id="modalImage">
</div>
<script>
  function showFullImage(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = "block";
    modalImg.src = src;
  }
  
  function closeModal() {
    document.getElementById('imageModal').style.display = "none";
  }
  
  // Close modal when clicking outside the image
  window.onclick = function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
</script>

      </body>
    </html>
  `;
}
