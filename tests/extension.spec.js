const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use a real GitHub gist for testing (from the README example)
const TEST_GIST_URL = 'https://gist.github.com/JLLeitschuh/f992d92df03e47d79058b1afd661e1e7';

// Extension path
const extensionPath = path.resolve(__dirname, '..');

test.describe('GitHub Gist Embed Extension', () => {
  let context;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    // Create a temporary user data directory
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-extension-'));
    
    // Launch browser with extension loaded
    // In CI, we need to use headless mode with proper flags
    // Extensions can work in headless mode with Chrome's new headless implementation
    const isCI = !!process.env.CI;
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: isCI,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        // Additional args for CI environment
        ...(isCI ? [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ] : []),
      ],
    });
  });

  test.beforeEach(async () => {
    // Create a new page for each test
    page = await context.newPage();
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: TEST_GIST_URL });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
    // Clean up temporary directory
    if (userDataDir && fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('should display Copy Embed button on gist page', async () => {
    await page.goto(TEST_GIST_URL);
    
    // Wait for the page to load and the extension to inject the button
    await page.waitForSelector('.copy-embed-btn', { timeout: 10000 });
    
    // Verify the button exists and has correct text
    const copyButton = page.locator('.copy-embed-btn');
    await expect(copyButton.first()).toBeVisible();
    await expect(copyButton.first().locator('.Button-label')).toHaveText('Copy Embed');
  });

  test('should copy embed URL to clipboard when button is clicked', async () => {
    await page.goto(TEST_GIST_URL);
    
    // Wait for the button to appear
    await page.waitForSelector('.copy-embed-btn', { timeout: 10000 });
    
    // Click the first Copy Embed button
    const copyButton = page.locator('.copy-embed-btn').first();
    await copyButton.click();
    
    // Wait for the button text to change to "Copied!"
    await expect(copyButton.locator('.Button-label')).toHaveText('Copied!', { timeout: 3000 });
    
    // Read from clipboard
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    // Verify the clipboard contains the expected embed URL format
    expect(clipboardText).toMatch(/^https:\/\/gist\.github\.com\/[^\/]+\/[^\/]+\?file=.+$/);
    expect(clipboardText).toContain('gist.github.com');
    expect(clipboardText).toContain('?file=');
  });

  test('should restore button text after copying', async () => {
    await page.goto(TEST_GIST_URL);
    
    // Wait for the button to appear
    await page.waitForSelector('.copy-embed-btn', { timeout: 10000 });
    
    const copyButton = page.locator('.copy-embed-btn').first();
    
    // Click the button
    await copyButton.click();
    
    // Wait for "Copied!" text
    await expect(copyButton.locator('.Button-label')).toHaveText('Copied!', { timeout: 3000 });
    
    // Wait for it to revert back to "Copy Embed" (after 2 seconds)
    await expect(copyButton.locator('.Button-label')).toHaveText('Copy Embed', { timeout: 5000 });
  });

  test('should work with multiple files in a gist', async () => {
    await page.goto(TEST_GIST_URL);
    
    // Wait for buttons to appear
    await page.waitForSelector('.copy-embed-btn', { timeout: 10000 });
    
    // Count how many Copy Embed buttons are present
    const buttonCount = await page.locator('.copy-embed-btn').count();
    
    // Should have at least one button (assuming the test gist has files)
    expect(buttonCount).toBeGreaterThan(0);
    
    // Verify each button is visible and has the correct structure
    for (let i = 0; i < buttonCount; i++) {
      const button = page.locator('.copy-embed-btn').nth(i);
      await expect(button).toBeVisible();
      await expect(button.locator('.Button-label')).toHaveText('Copy Embed');
    }
  });

  test('should place button before Raw button', async () => {
    await page.goto(TEST_GIST_URL);
    
    // Wait for buttons to appear
    await page.waitForSelector('.copy-embed-btn', { timeout: 10000 });
    
    // Find the first Copy Embed button and its parent
    const copyButton = page.locator('.copy-embed-btn').first();
    const rawButton = page.locator('a.Button:has-text("Raw")').first();
    
    // Both should be visible
    await expect(copyButton).toBeVisible();
    await expect(rawButton).toBeVisible();
    
    // Get their positions in the DOM
    const copyButtonIndex = await copyButton.evaluate((el) => {
      return Array.from(el.parentElement.children).indexOf(el);
    });
    
    const rawButtonIndex = await rawButton.evaluate((el) => {
      return Array.from(el.parentElement.children).indexOf(el);
    });
    
    // Copy Embed button should come before Raw button
    expect(copyButtonIndex).toBeLessThan(rawButtonIndex);
  });
});

