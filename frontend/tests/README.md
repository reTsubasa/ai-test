# Frontend Tests

This directory contains all test files for the VyOS Web UI frontend application.

## Test Types

### Unit Tests (`unit.test.tsx`)
Tests for individual React components and utility functions.

**Run:**
```bash
npm test -- unit
```

**What's tested:**
- UI Components (Button, Input, Card, Alert, Dialog, etc.)
- Layout Components (Header, Sidebar)
- ProtectedRoute authentication wrapper
- Utility functions (`cn` className merger)
- ThemeProvider context
- Snapshot tests for components

### Integration Tests (`integration.test.tsx`)
Tests that verify the interaction between components, stores, services, and routing.

**Run:**
```bash
npm test -- integration
```

**What's tested:**
- Complete authentication flow (login, logout)
- Node management operations (CRUD)
- Dashboard data loading and display
- Configuration management flow
- WebSocket connections
- Routing between pages

### E2E Tests (`e2e.spec.ts`)
End-to-end tests that simulate real user interactions using Playwright.

**Run:**
```bash
npx playwright test
```

**What's tested:**
- Complete user journeys
- Authentication workflows
- Node management workflows
- Network configuration workflows
- Monitoring workflows
- System management workflows
- User management workflows
- Responsive design
- Performance metrics
- Accessibility compliance

## Running Tests

### All Tests
```bash
# Run all unit and integration tests
npm test

# Run all E2E tests
npx playwright test
```

### Unit Tests Only
```bash
npm test -- unit
```

### Integration Tests Only
```bash
npm test -- integration
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test -- unit.test.tsx
```

### E2E Tests with UI
```bash
npx playwright test --ui
```

### E2E Tests Headed
```bash
npx playwright test --headed
```

## Test Configuration

### Vitest (Unit/Integration Tests)
Configuration in `vitest.config.ts`:
- Uses jsdom environment
- Supports global test functions (describe, it, expect, etc.)
- Coverage threshold set to 70%
- Path alias `@` points to `./src`

### Playwright (E2E Tests)
Configuration in `playwright.config.ts`:
- Supports Chrome, Firefox, and WebKit
- Default base URL: `http://localhost:3000`
- Can be overridden with `BASE_URL` environment variable

## Required Dependencies

### Development Dependencies
```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "vitest": "^1.0.0",
  "jsdom": "^23.0.0",
  "@vitejs/plugin-react": "^4.3.0",
  "playwright": "^1.40.0",
  "@vitest/coverage-v8": "^1.0.0"
}
```

### Install Command
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom @vitejs/plugin-react @vitest/coverage-v8 playwright
npx playwright install
```

## Test Files

- `unit.test.tsx` - Component and utility function tests
- `integration.test.tsx` - Integration tests for feature flows
- `e2e.spec.ts` - End-to-end test scenarios
- `setup.ts` - Global test setup and mocks

## Adding New Tests

### Adding a Unit Test
1. Open `unit.test.tsx`
2. Add a new `describe` block for your component
3. Add `it` blocks for specific behaviors
4. Run the tests to verify

### Adding an Integration Test
1. Open `integration.test.tsx`
2. Add a new `describe` block for your feature
3. Mock any required services and stores
4. Test the complete flow
5. Run the tests to verify

### Adding an E2E Test
1. Open `e2e.spec.ts`
2. Add a new `test.describe` block
3. Write test steps using Playwright APIs
4. Run the tests to verify

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly with setup, action, and verification phases
2. **Descriptive Names**: Use clear test names that describe what is being tested
3. **Isolation**: Each test should be independent and not rely on others
4. **Mock External Dependencies**: Mock API calls, stores, and other external dependencies
5. **Test User Behavior**: Focus on testing user interactions rather than implementation details
6. **Use Selectors**: Use accessible selectors (aria-label, role, text) when possible
7. **Clean Up**: Use `afterEach` to clean up state between tests

## Coverage Goals

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## Troubleshooting

### Tests fail with "module not found"
Ensure all path aliases in `vitest.config.ts` match those in `tsconfig.json`.

### E2E tests fail to find elements
- Check if the application is running at the correct URL
- Verify selectors are targeting elements after they've rendered
- Add appropriate `waitFor` calls for dynamic content

### Tests are slow
- Use test isolation to prevent interference
- Mock expensive operations (API calls, timers)
- Consider running tests in parallel where possible

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
- name: Run Unit Tests
  run: npm test -- --coverage

- name: Run E2E Tests
  run: npx playwright test
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest DOM](https://github.com/testing-library/jest-dom)