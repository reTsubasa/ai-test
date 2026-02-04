# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure Overview

This is a development directory for an AI-related project. Based on the configuration and typical patterns, this appears to be set up for developing AI applications or tools.

## Common Commands

### Development Setup
```bash
# Install dependencies (if package.json exists)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Running Individual Tests
```bash
# Run specific test file
npm test path/to/test-file.test.js

# Run tests with coverage
npm run test:coverage

# Run watch mode for tests
npm run test:watch
```

## Key Files and Directories

- `src/` - Source code directory
- `tests/` - Test files
- `package.json` - Project dependencies and scripts
- `README.md` - Project documentation
- `.gitignore` - Git ignore patterns

## Development Workflow

1. Make changes to source files in `src/`
2. Run tests to ensure functionality is preserved
3. Lint code to maintain consistency
4. Commit changes with descriptive messages

## Architecture Notes

This appears to be a typical Node.js project structure that would include:
- Entry point files (index.js, main.js)
- Modular components
- Configuration files
- Test suites

## Environment Setup

The `.claude` directory contains configuration for Claude's access permissions, including:
- Web fetching capabilities for documentation sites
- GitHub access permissions
- Web search functionality

This project likely involves AI tooling or system administration tasks based on the configuration.