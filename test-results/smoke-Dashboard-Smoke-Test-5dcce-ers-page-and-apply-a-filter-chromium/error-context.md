# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Dashboard Smoke Tests >> should navigate to the customers page and apply a filter
- Location: tests/smoke.spec.ts:23:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5173/customers", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard Smoke Tests', () => {
  4  |   test('should load the overview page properly', async ({ page }) => {
  5  |     // We assume the dev server runs on localhost:5173
  6  |     await page.goto('http://localhost:5173/');
  7  |     
  8  |     // Expect the page title to contain our app name or standard title
  9  |     await expect(page).toHaveTitle(/Banking Dashboard/); 
  10 |     
  11 |     // Wait for the app-shell to render
  12 |     const appShell = page.locator('app-shell');
  13 |     await expect(appShell).toBeVisible();
  14 |     
  15 |     // Wait for KPI cards to populate
  16 |     const kpiCard = page.locator('kpi-card').first();
  17 |     await expect(kpiCard).toBeVisible();
  18 |     
  19 |     // The DB loading overlay should disappear
  20 |     await expect(page.locator('text=Initializing local analytics engine...')).not.toBeVisible();
  21 |   });
  22 | 
  23 |   test('should navigate to the customers page and apply a filter', async ({ page }) => {
> 24 |     await page.goto('http://localhost:5173/customers');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  25 |     
  26 |     // Check that we are on the customers page
  27 |     const appShell = page.locator('app-shell');
  28 |     await expect(appShell).toBeVisible();
  29 |     
  30 |     // Find the filter bar
  31 |     const filterBar = page.locator('filter-bar');
  32 |     await expect(filterBar).toBeVisible();
  33 |     
  34 |     // Select a job
  35 |     // The select is inside the shadow root, so we pierce it if possible, 
  36 |     // or just interact via keyboard/click since Playwright pierces shadow dom natively for locators.
  37 |     const jobSelect = page.locator('filter-bar >> select').first();
  38 |     await jobSelect.selectOption('management');
  39 |     
  40 |     // Wait for the URL to update with the query parameter
  41 |     await expect(page).toHaveURL(/job=management/);
  42 |     
  43 |     // Expect the active filter chip to appear
  44 |     const chip = page.locator('filter-bar >> text=Job: management');
  45 |     await expect(chip).toBeVisible();
  46 |   });
  47 | 
  48 |   test('should navigate to branches and verify map render', async ({ page }) => {
  49 |     await page.goto('http://localhost:5173/branches');
  50 |     
  51 |     // Ensure the leaflet map container is present
  52 |     const mapContainer = page.locator('#leaflet-branch-map');
  53 |     await expect(mapContainer).toBeVisible();
  54 |     
  55 |     // Wait a brief moment for Leaflet to initialize
  56 |     await page.waitForTimeout(1000);
  57 |     
  58 |     // The leaflet control (zoom) should be visible, confirming the library loaded
  59 |     const leafletControl = page.locator('.leaflet-control-zoom');
  60 |     await expect(leafletControl).toBeVisible();
  61 |   });
  62 | 
  63 |   test('should execute drill-through row clicks correctly', async ({ page }) => {
  64 |     await page.goto('http://localhost:5173/branches');
  65 |     
  66 |     // The Branches leaderboard data-table
  67 |     const dataTable = page.locator('data-table');
  68 |     
  69 |     // Wait for rows
  70 |     const firstRow = dataTable.locator('tbody tr').first();
  71 |     await expect(firstRow).toBeVisible();
  72 |     
  73 |     // Click the row
  74 |     await firstRow.click();
  75 |     
  76 |     // It should add a branch_id to the URL
  77 |     await expect(page).toHaveURL(/branch_id=BR-/);
  78 |   });
  79 | });
  80 | 
```