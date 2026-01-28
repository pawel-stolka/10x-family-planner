# E2E Test Debugging Guide

## 🎯 Visual Debugging Options

### Option 1: Playwright UI Mode (RECOMMENDED)
Interactive mode where you can see the browser, step through tests, and inspect the DOM:

```bash
npx playwright test --ui
```

This opens a UI where you can:
- See all tests in a sidebar
- Click on a test to run it
- Watch the browser execute in real-time
- Pause and inspect the page at any point
- See console logs and network requests
- Step through actions one by one

### Option 2: Debug Mode
Step-by-step debugging with Playwright Inspector:

```bash
npx playwright test --debug
```

Or for a specific test file:
```bash
npx playwright test apps/frontend-e2e/src/auth.spec.ts --debug
```

This will:
- Open Playwright Inspector
- Pause before each action
- Let you step through line by line
- Show the browser window

### Option 3: Headed Mode (Browser Visible)
Run tests with the browser window visible:

```bash
npx playwright test --headed
```

Or via Nx:
```bash
npx nx e2e frontend-e2e -- --headed
```

### Option 4: Slow Motion
Run tests in slow motion to see what's happening:

```bash
npx playwright test --slow-mo=1000
```

This adds a 1-second delay between actions.

### Option 5: Trace Viewer
View detailed traces of test execution (already enabled for failed tests):

After a test fails, run:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## 🔍 Debugging Specific Tests

### Focus on One Test
Add `.only` to run just one test:

```typescript
test.only('login happy path with seeded dev user', async ({ page }) => {
  // ...
});
```

### Pause Execution
Add `await page.pause();` anywhere in your test to pause and inspect:

```typescript
test('login happy path', async ({ page }) => {
  await page.goto('/login');
  await page.pause(); // Browser will pause here, you can inspect
  // ...
});
```

### Take Screenshots
Take screenshots at any point:

```typescript
await page.screenshot({ path: 'debug-login.png' });
```

### Console Logging
Log page content or state:

```typescript
console.log('Current URL:', page.url());
console.log('Page title:', await page.title());
```

### Check for Errors
Wait for and check console errors:

```typescript
page.on('console', msg => console.log('Browser console:', msg.text()));
page.on('pageerror', error => console.log('Page error:', error.message()));
```

## 🐛 Common Issues

### Login Fails
1. Check if backend is running: `npx nx serve backend`
2. Verify seeded user exists with correct email/password
3. Check browser console for API errors
4. Verify JWT token is being set in localStorage

### Timeout Errors
1. Increase timeout: `await page.waitForURL('**/schedule**', { timeout: 30000 });`
2. Check if page is actually loading (use UI mode to see)
3. Verify network requests are completing

### Element Not Found
1. Use UI mode to see what's actually on the page
2. Check if element is visible: `await page.getByRole('button').isVisible()`
3. Wait for element: `await page.waitForSelector('button')`

## 📝 Quick Debug Checklist

When a test fails:
1. ✅ Run with `--ui` to see what's happening visually
2. ✅ Check browser console for errors
3. ✅ Check Network tab for failed API calls
4. ✅ Verify backend is running
5. ✅ Verify test user credentials are correct
6. ✅ Add `page.pause()` before the failing line
7. ✅ Take a screenshot: `await page.screenshot({ path: 'debug.png' })`

## 🚀 Recommended Workflow

1. **Start with UI Mode**: `npx playwright test --ui`
2. **Run the failing test** by clicking on it
3. **Watch the browser** execute the test
4. **Pause at failure point** to inspect
5. **Check console/network** tabs in browser DevTools
6. **Fix the issue** and re-run
