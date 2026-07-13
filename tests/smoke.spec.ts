import { test, expect } from '@playwright/test';

test.describe('Dashboard Smoke Tests', () => {
  test('should load the overview page properly', async ({ page }) => {
    // We assume the dev server runs on localhost:5173
    await page.goto('http://localhost:5173/');
    
    // Expect the page title to contain our app name or standard title
    await expect(page).toHaveTitle(/Banking Dashboard/); 
    
    // Wait for the app-shell to render
    const appShell = page.locator('app-shell');
    await expect(appShell).toBeVisible();
    
    // Wait for KPI cards to populate
    const kpiCard = page.locator('kpi-card').first();
    await expect(kpiCard).toBeVisible();
    
    // The DB loading overlay should disappear
    await expect(page.locator('text=Initializing local analytics engine...')).not.toBeVisible();
  });

  test('should navigate to the customers page and apply a filter', async ({ page }) => {
    await page.goto('http://localhost:5173/customers');
    
    // Check that we are on the customers page
    const appShell = page.locator('app-shell');
    await expect(appShell).toBeVisible();
    
    // Find the filter bar
    const filterBar = page.locator('filter-bar');
    await expect(filterBar).toBeVisible();
    
    // Select a job
    // The select is inside the shadow root, so we pierce it if possible, 
    // or just interact via keyboard/click since Playwright pierces shadow dom natively for locators.
    const jobSelect = page.locator('filter-bar >> select').first();
    await jobSelect.selectOption('management');
    
    // Wait for the URL to update with the query parameter
    await expect(page).toHaveURL(/job=management/);
    
    // Expect the active filter chip to appear
    const chip = page.locator('filter-bar >> text=Job: management');
    await expect(chip).toBeVisible();
  });

  test('should navigate to branches and verify map render', async ({ page }) => {
    await page.goto('http://localhost:5173/branches');
    
    // Ensure the leaflet map container is present
    const mapContainer = page.locator('#leaflet-branch-map');
    await expect(mapContainer).toBeVisible();
    
    // Wait a brief moment for Leaflet to initialize
    await page.waitForTimeout(1000);
    
    // The leaflet control (zoom) should be visible, confirming the library loaded
    const leafletControl = page.locator('.leaflet-control-zoom');
    await expect(leafletControl).toBeVisible();
  });

  test('should execute drill-through row clicks correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/branches');
    
    // The Branches leaderboard data-table
    const dataTable = page.locator('data-table');
    
    // Wait for rows
    const firstRow = dataTable.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Click the row
    await firstRow.click();
    
    // It should add a branch_id to the URL
    await expect(page).toHaveURL(/branch_id=BR-/);
  });
});
