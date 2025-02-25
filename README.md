# iOS Test Automation Agent

An AI-driven test automation agent for iOS applications that uses natural language instructions to perform automated testing without requiring app-specific code or page objects.

## Overview

This project creates a flexible, context-free test automation solution that can:

- Test any iOS app using natural language instructions
- Analyze app screens using LLMs to determine appropriate actions
- Execute test steps automatically
- Generate detailed test reports with screenshots
- Run via a simple web interface

The agent uses WebdriverIO to interact with iOS Simulator, OpenAI's GPT models to interpret screens and decide actions, and provides a comprehensive web dashboard for test management.

## Prerequisites

1. Node.js (v16+ recommended)
2. Appium server installed and running
3. Xcode with iOS Simulator configured
4. An iOS app (.app or .ipa file) to test
5. OpenAI API key (for LLM integration)

## Installation and Setup

### 1. Install Appium and Required Drivers

```bash
# Install Appium globally
npm install -g appium

# Install XCUITest driver for iOS testing
appium driver install xcuitest

# Verify installation
appium --version
appium driver list
```

### 2. Clone and Set Up the Project

```bash
# Clone the repository
git clone https://github.com/yourusername/ios-test-automation-agent.git
cd ios-test-automation-agent

# Install dependencies
npm install

# Create environment file from example
cp .env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file and set the following variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
APP_PATH=/path/to/your/app.app

# Device Configuration
PLATFORM_VERSION=18.0
DEVICE_NAME=iPhone 16 Pro
```

## Project Structure

```
ios-test-automation-agent/
├── src/
│   ├── core/                           # Core agent functionality
│   │   ├── agent.ts                    # Main agent orchestration logic
│   │   ├── test-runner.ts              # Test execution and flow control
│   │   └── state-tracker.ts            # Test progress and state management
│   │
│   ├── llm/                            # LLM integration
│   │   ├── llm-service.ts              # Abstract LLM service interface
│   │   ├── openai-llm.ts               # OpenAI implementation
│   │   ├── prompt-templates.ts         # Structured prompts for different scenarios
│   │   └── response-parser.ts          # Parse and validate LLM responses
│   │
│   ├── device/                         # Device interaction
│   │   ├── driver-manager.ts           # WebdriverIO session management
│   │   ├── element-finder.ts           # Element identification strategies
│   │   ├── actions.ts                  # UI interaction actions (tap, type, etc.)
│   │   └── screen-capture.ts           # Screenshot and XML capture utilities
│   │
│   ├── utils/                          # Utility functions
│   │   ├── logger.ts                   # Logging functionality
│   │   ├── file-manager.ts             # File operations for results
│   │   └── error-handler.ts            # Error handling utilities
│   │
│   ├── web/                            # Web interface
│   │   ├── server.ts                   # Express server setup
│   │   ├── routes.ts                   # API routes
│   │   ├── handlers/                   # Request handlers
│   │   │   ├── restart-test-handler.ts
│   │   │   └── test-results-handler.ts
│   │   └── views/                      # HTML templates
│   │       ├── base-view.ts
│   │       ├── home-view.ts
│   │       ├── start-test-view.ts
│   │       └── test-results-view.ts
│   │
│   ├── types/                          # Type definitions
│   │   ├── llm-types.ts                # LLM request/response types
│   │   ├── test-types.ts               # Test execution types
│   │   └── device-types.ts             # Device interaction types
│   │
│   └── index.ts                        # Application entry point
│
├── config/                             # Configuration
│   ├── default.ts                      # Default configuration
│   └── environment.ts                  # Environment-specific settings
│
├── tests/                              # Unit and integration tests
│   ├── unit/                           # Unit tests
│   └── integration/                    # Integration tests
│
├── examples/                           # Example test scenarios
│
├── docs/                               # Documentation
│
├── .env.example                        # Example environment variables
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .gitignore
└── README.md
```

## Running the Agent

### 1. Start the Appium Server

```bash
appium --base-path /wd/hub
```

### 2. Start the Test Agent Server

```bash
npm run start
```

### 3. Access the Web Interface

Open your browser and navigate to:

```
http://localhost:3000
```

### 4. Start a Test

1. Click "Start a New Test"
2. Enter a natural language test instruction (e.g., "Log in with username 'testuser' and password 'password123', then navigate to the profile section and verify the user's email is displayed")
3. Click "Start Test"

The agent will:

- Launch the iOS Simulator with your app
- Analyze each screen using the LLM
- Determine and execute appropriate actions
- Capture screenshots at each step
- Generate a detailed test report

## Example Test Instructions

- "Sign up as a new user with email test@example.com and password Test123!"
- "Search for 'running shoes', add the first item to cart, and proceed to checkout"
- "Navigate to settings, enable dark mode, then return to the home screen"

## Advanced Configuration

You can customize the agent's behavior by modifying the configuration files in the `config/` directory:

- `default.ts`: Default configuration values
- `environment.ts`: Environment-specific configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
