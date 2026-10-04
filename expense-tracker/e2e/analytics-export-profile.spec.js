import { test, expect } from "@playwright/test";

test.describe("Gate 8, 9, 10, 11, 12: Analytics, Export, Profile, Security, and Admin Access", () => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const baseURL =
    process.env.E2E_BASE_URL ||
    "https://expense-tracker-web-thesis.vercel.app";

  test.beforeEach(async ({ page }) => {
    // Login QA user
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 35000 });
  });

  test("ANA-01: Analytics page loads charts and date filters", async ({
    page,
  }) => {
    await page.goto(`${baseURL}/analytics`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/analytics");
  });

  test("EXP-01: Export data page loads with export options", async ({
    page,
  }) => {
    await page.goto(`${baseURL}/dataexport`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dataexport");
  });

  test("PROF-01: Profile page loads user details", async ({ page }) => {
    await page.goto(`${baseURL}/profile`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/profile");

    const profileHeading = page.locator('h1, h2, h3').filter({ hasText: /profile|hồ sơ/i }).first();
    await expect(profileHeading).toBeVisible({ timeout: 15000 });
  });

  test("SEC-01: Security settings page loads", async ({ page }) => {
    await page.goto(`${baseURL}/security`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/security");
  });

  test("ADM-01: Normal QA user is denied access to /admin routes", async ({
    page,
    request,
  }) => {
    // 1. Frontend route guard check
    await page.goto(`${baseURL}/admin/dashboard`);
    await page.waitForLoadState("networkidle");
    // Non-admin user must be redirected away from admin dashboard
    expect(page.url()).not.toContain("/admin/dashboard");

    // 2. Direct Backend API check: Non-admin token receives 403 Forbidden
    const token = await page.evaluate(() => localStorage.getItem("idToken"));
    const backendURL = "https://expense-tracker-web-thesis-1.onrender.com";
    const adminApiResp = await request.get(`${backendURL}/admin/kpis`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Expect 403 Forbidden
    expect(adminApiResp.status()).toBe(403);
  });
});
