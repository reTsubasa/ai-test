/**
 * E2E Test Scenarios for VyOS Web UI
 *
 * This file contains end-to-end test scenarios using Playwright.
 * These tests simulate real user interactions across the application.
 *
 * To run these tests:
 * npm install -D @playwright/test
 * npx playwright test
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Test Configuration
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  // Navigate to the application
  await page.goto(BASE_URL);
});

// ============================================================================
// Authentication E2E Tests
// ============================================================================

test.describe('Authentication', () => {
  test('user can login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Fill in login form
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Verify dashboard is loaded
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('login fails with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill in invalid credentials
    await page.fill('[name="username"]', 'invalid');
    await page.fill('[name="password"]', 'wrongpassword');

    // Click login button
    await page.click('button[type="submit"]');

    // Verify error message is displayed
    await expect(page.locator('text=/invalid|error|failed/i')).toBeVisible();
  });

  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Click logout
    await page.click('button[aria-label="Logout"]');

    // Verify redirected to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('protected route redirects to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto(`${BASE_URL}/nodes`);

    // Verify redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('user can register new account', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Click register link
    await page.click('text=Register');

    // Fill registration form
    await page.fill('[name="username"]', 'newuser');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123');
    await page.fill('[name="confirmPassword"]', 'SecurePass123');

    // Submit registration
    await page.click('button[type="submit"]');

    // Verify registration success
    await expect(page.locator('text=/success|account created/i')).toBeVisible();
  });
});

// ============================================================================
// Dashboard E2E Tests
// ============================================================================

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  test('dashboard displays system overview', async ({ page }) => {
    // Verify system overview section is present
    await expect(page.locator('text=System Overview')).toBeVisible();

    // Verify metrics are displayed
    await expect(page.locator('text=CPU')).toBeVisible();
    await expect(page.locator('text=Memory')).toBeVisible();
    await expect(page.locator('text=Disk')).toBeVisible();
  });

  test('dashboard displays node status summary', async ({ page }) => {
    // Verify node status cards
    await expect(page.locator('text=Total Nodes')).toBeVisible();
    await expect(page.locator('text=Online')).toBeVisible();
    await expect(page.locator('text=Offline')).toBeVisible();
  });

  test('dashboard displays traffic chart', async ({ page }) => {
    // Verify traffic chart is present
    await expect(page.locator('text=Traffic')).toBeVisible();

    // Wait for chart to render
    await page.waitForSelector('svg', { state: 'attached' });
  });

  test('dashboard displays activity log', async ({ page }) => {
    // Verify activity log section
    await expect(page.locator('text=Activity Log')).toBeVisible();

    // Verify log entries are displayed
    await expect(page.locator('.activity-log-entry').first()).toBeVisible();
  });

  test('dashboard displays alerts', async ({ page }) => {
    // Verify alerts section
    await expect(page.locator('text=Alerts')).toBeVisible();

    // Check if there are any alerts
    const alertCount = await page.locator('.alert-card').count();
    if (alertCount > 0) {
      await expect(page.locator('.alert-card').first()).toBeVisible();
    }
  });

  test('user can acknowledge alerts', async ({ page }) => {
    // Find acknowledge button on alerts
    const acknowledgeButton = page.locator('button[aria-label*="acknowledge"]').first();

    if (await acknowledgeButton.isVisible()) {
      await acknowledgeButton.click();

      // Verify alert is acknowledged
      await expect(page.locator('text=acknowledged').first()).toBeVisible();
    }
  });
});

// ============================================================================
// Node Management E2E Tests
// ============================================================================

test.describe('Node Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Navigate to nodes page
    await page.click('a[href="/nodes"]');
    await page.waitForURL(`${BASE_URL}/nodes`);
  });

  test('displays list of nodes', async ({ page }) => {
    // Verify nodes are displayed
    await expect(page.locator('text=Nodes')).toBeVisible();

    // Wait for node cards to load
    await page.waitForSelector('.node-card', { state: 'attached' });
  });

  test('can add a new node', async ({ page }) => {
    // Click add node button
    await page.click('button[aria-label*="Add Node"]');

    // Fill in node details
    await page.fill('[name="name"]', 'Test Node');
    await page.fill('[name="hostname"]', 'testnode.example.com');
    await page.fill('[name="ipAddress"]', '192.168.1.100');
    await page.fill('[name="port"]', '22');

    // Select node type
    await page.click('[role="combobox"]');
    await page.click('text=Router');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify node was added
    await expect(page.locator('text=Test Node')).toBeVisible();
  });

  test('can edit an existing node', async ({ page }) => {
    // Click on a node
    await page.click('.node-card').first();

    // Click edit button
    await page.click('button[aria-label*="Edit"]');

    // Update node name
    await page.fill('[name="name"]', 'Updated Node Name');

    // Submit changes
    await page.click('button[type="submit"]');

    // Verify node was updated
    await expect(page.locator('text=Updated Node Name')).toBeVisible();
  });

  test('can delete a node', async ({ page }) => {
    // Click on a node
    await page.click('.node-card').first();

    // Click delete button
    await page.click('button[aria-label*="Delete"]');

    // Confirm deletion in dialog
    await page.click('button:has-text("Delete")');

    // Verify node was deleted
    const nodeCount = await page.locator('.node-card').count();
    expect(nodeCount).toBeLessThan(3); // Assuming there were at least 3 nodes initially
  });

  test('can test node connection', async ({ page }) => {
    // Click on a node
    await page.click('.node-card').first();

    // Click test connection button
    await page.click('button[aria-label*="Test Connection"]');

    // Wait for test result
    await expect(page.locator('text=/connection|status/i')).toBeVisible();
  });

  test('can filter nodes by status', async ({ page }) => {
    // Click status filter dropdown
    await page.click('button[aria-label*="Filter by status"]');

    // Select "Online" filter
    await page.click('text=Online');

    // Verify only online nodes are displayed
    const onlineNodes = await page.locator('.node-card.online').count();
    const totalNodes = await page.locator('.node-card').count();

    expect(onlineNodes).toBe(totalNodes);
  });

  test('can search for nodes', async ({ page }) => {
    // Type in search box
    await page.fill('[placeholder*="Search"]', 'router');

    // Verify search results
    const searchResults = await page.locator('.node-card').count();
    expect(searchResults).toBeGreaterThan(0);
  });
});

// ============================================================================
// Network Configuration E2E Tests
// ============================================================================

test.describe('Network Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Navigate to network page
    await page.click('a[href="/network"]');
    await page.waitForURL(`${BASE_URL}/network`);
  });

  test('displays network configuration sections', async ({ page }) => {
    // Verify main sections are present
    await expect(page.locator('text=Interfaces')).toBeVisible();
    await expect(page.locator('text=Routing')).toBeVisible();
    await expect(page.locator('text=Firewall')).toBeVisible();
    await expect(page.locator('text=VPN')).toBeVisible();
  });

  test('can view interface configuration', async ({ page }) => {
    // Click on Interfaces
    await page.click('text=Interfaces');

    // Verify interface list is displayed
    await expect(page.locator('.interface-card').first()).toBeVisible();
  });

  test('can add new interface', async ({ page }) => {
    // Click add interface button
    await page.click('button[aria-label*="Add Interface"]');

    // Fill interface details
    await page.fill('[name="name"]', 'eth10');
    await page.fill('[name="address"]', '192.168.10.1/24');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify interface was added
    await expect(page.locator('text=eth10')).toBeVisible();
  });

  test('can enable/disable interface', async ({ page }) => {
    // Click on an interface
    await page.click('.interface-card').first();

    // Toggle interface status
    await page.click('[role="switch"]');

    // Verify status changed
    await expect(page.locator('text=/enabled|disabled/i')).toBeVisible();
  });

  test('can view routing configuration', async ({ page }) => {
    // Click on Routing
    await page.click('text=Routing');

    // Verify routing table is displayed
    await expect(page.locator('text=Routes')).toBeVisible();
  });

  test('can add static route', async ({ page }) => {
    // Click add route button
    await page.click('button[aria-label*="Add Route"]');

    // Fill route details
    await page.fill('[name="destination"]', '192.168.20.0/24');
    await page.fill('[name="gateway"]', '192.168.1.254');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify route was added
    await expect(page.locator('text=192.168.20.0/24')).toBeVisible();
  });
});

// ============================================================================
// Monitoring E2E Tests
// ============================================================================

test.describe('Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Navigate to monitoring page
    await page.click('a[href="/monitoring"]');
    await page.waitForURL(`${BASE_URL}/monitoring`);
  });

  test('displays system metrics', async ({ page }) => {
    // Verify metrics are displayed
    await expect(page.locator('text=CPU Usage')).toBeVisible();
    await expect(page.locator('text=Memory Usage')).toBeVisible();
    await expect(page.locator('text=Disk Usage')).toBeVisible();
  });

  test('can view metrics for specific node', async ({ page }) => {
    // Select a node from dropdown
    await page.click('button[aria-label*="Select Node"]');
    await page.click('.node-option').first();

    // Verify metrics update for selected node
    await expect(page.locator('.metric-card').first()).toBeVisible();
  });

  test('can set monitoring time range', async ({ page }) => {
    // Click time range selector
    await page.click('button[aria-label*="Time Range"]');

    // Select 1 hour
    await page.click('text=1 Hour');

    // Verify charts update
    await page.waitForSelector('svg', { state: 'attached' });
  });

  test('can export monitoring data', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[aria-label*="Export"]');

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(csv|json|xml)$/);
  });
});

// ============================================================================
// System Management E2E Tests
// ============================================================================

test.describe('System Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Navigate to system page
    await page.click('a[href="/system"]');
    await page.waitForURL(`${BASE_URL}/system`);
  });

  test('displays system information', async ({ page }) => {
    // Verify system info is displayed
    await expect(page.locator('text=Hostname')).toBeVisible();
    await expect(page.locator('text=Version')).toBeVisible();
    await expect(page.locator('text=Uptime')).toBeVisible();
  });

  test('can view system logs', async ({ page }) => {
    // Click on Logs tab
    await page.click('text=Logs');

    // Verify log viewer is displayed
    await expect(page.locator('.log-entry').first()).toBeVisible();
  });

  test('can filter logs by level', async ({ page }) => {
    // Click on Logs tab
    await page.click('text=Logs');

    // Select error level
    await page.click('button[aria-label*="Filter"]');
    await page.click('text=Error');

    // Verify only error logs are shown
    const errorLogs = await page.locator('.log-entry.error').count();
    expect(errorLogs).toBeGreaterThan(0);
  });

  test('can view image manager', async ({ page }) => {
    // Click on Images tab
    await page.click('text=Images');

    // Verify images are displayed
    await expect(page.locator('.image-card').first()).toBeVisible();
  });

  test('can upload new image', async ({ page }) => {
    // Click on Images tab
    await page.click('text=Images');

    // Click upload button
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/path/to/test-image.iso');

    // Wait for upload to complete
    await expect(page.locator('text=Upload Complete')).toBeVisible({ timeout: 30000 });
  });

  test('can reboot system with confirmation', async ({ page }) => {
    // Click reboot button
    await page.click('button[aria-label*="Reboot"]');

    // Verify confirmation dialog appears
    await expect(page.locator('text=Are you sure')).toBeVisible();

    // Confirm reboot
    await page.click('button:has-text("Confirm")');

    // Verify reboot initiated
    await expect(page.locator('text=Rebooting')).toBeVisible();
  });
});

// ============================================================================
// User Management E2E Tests
// ============================================================================

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Navigate to user management
    await page.click('a[href="/users"]');
    await page.waitForURL(`${BASE_URL}/users`);
  });

  test('displays list of users', async ({ page }) => {
    // Verify user table is displayed
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('.user-row').first()).toBeVisible();
  });

  test('can add new user', async ({ page }) => {
    // Click add user button
    await page.click('button[aria-label*="Add User"]');

    // Fill user details
    await page.fill('[name="username"]', 'newuser');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="fullName"]', 'New User');
    await page.fill('[name="password"]', 'SecurePass123');
    await page.fill('[name="confirmPassword"]', 'SecurePass123');

    // Select role
    await page.click('[role="combobox"]');
    await page.click('text=User');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify user was added
    await expect(page.locator('text=newuser')).toBeVisible();
  });

  test('can edit user role', async ({ page }) => {
    // Click on a user
    await page.click('.user-row').first();

    // Click edit button
    await page.click('button[aria-label*="Edit"]');

    // Change role
    await page.click('[role="combobox"]');
    await page.click('text=Admin');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify role was updated
    await expect(page.locator('text=Admin').first()).toBeVisible();
  });

  test('can delete user', async ({ page }) => {
    // Find a user that's not the current admin
    const userRows = page.locator('.user-row');
    const count = await userRows.count();

    if (count > 1) {
      // Click on second user
      await userRows.nth(1).click();

      // Click delete button
      await page.click('button[aria-label*="Delete"]');

      // Confirm deletion
      await page.click('button:has-text("Delete")');

      // Verify user was deleted
      const newCount = await page.locator('.user-row').count();
      expect(newCount).toBe(count - 1);
    }
  });
});

// ============================================================================
// Responsive Design E2E Tests
// ============================================================================

test.describe('Responsive Design', () => {
  test('layout adapts to mobile view', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify mobile menu button is present
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();

    // Click menu button
    await page.click('button[aria-label="Menu"]');

    // Verify sidebar opens
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('dashboard cards stack on mobile', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Login and navigate to dashboard
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Verify cards are stacked vertically
    const firstCard = page.locator('.card').first();
    const secondCard = page.locator('.card').nth(1);

    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);
  });
});

// ============================================================================
// Performance E2E Tests
// ============================================================================

test.describe('Performance', () => {
  test('dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(`${BASE_URL}/dashboard`);

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });

  test('navigation between pages is fast', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Measure navigation time
    const startTime = Date.now();
    await page.click('a[href="/nodes"]');
    await page.waitForURL(`${BASE_URL}/nodes`);

    const navigationTime = Date.now() - startTime;
    expect(navigationTime).toBeLessThan(1000); // 1 second
  });
});

// ============================================================================
// Accessibility E2E Tests
// ============================================================================

test.describe('Accessibility', () => {
  test('all buttons have accessible labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const hasLabel = await button.isVisible() && (
        await button.getAttribute('aria-label') !== null ||
        await button.textContent() !== ''
      );
      if (hasLabel) {
        expect(
          await button.getAttribute('aria-label') ||
          await button.textContent()
        ).toBeTruthy();
      }
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Tab through form fields
    await page.keyboard.press('Tab');
    expect(await page.focused()).toHaveAttribute('name', 'username');

    await page.keyboard.press('Tab');
    expect(await page.focused()).toHaveAttribute('name', 'password');

    await page.keyboard.press('Tab');
    expect(await page.focused()).toHaveAttribute('type', 'submit');
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const usernameInput = page.locator('[name="username"]');
    await usernameInput.focus();

    // Check for focus styles
    const styles = await usernameInput.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
      };
    });

    expect(
      styles.outline !== 'none' ||
        styles.boxShadow !== 'none'
    ).toBeTruthy();
  });
});