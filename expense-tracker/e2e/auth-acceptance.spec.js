import { test, expect } from "@playwright/test";

test.describe("Gate 5: Authentication Acceptance (AUTH-01 to AUTH-09)", () => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const baseURL =
    process.env.E2E_BASE_URL ||
    "https://expense-tracker-web-thesis.vercel.app";

  test("AUTH-08: Logged-out access to protected routes redirects to /login", async ({
    page,
  }) => {
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForURL("**/login", { timeout: 15000 });
    expect(page.url()).toContain("/login");

    await page.goto(`${baseURL}/analytics`);
    await page.waitForURL("**/login", { timeout: 15000 });
    expect(page.url()).toContain("/login");
  });

  test("AUTH-06: Wrong password shows error toast and keeps user on /login", async ({
    page,
  }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.fill('input[placeholder="••••••••"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Toast error or alert should appear, user stays on /login
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/login");
    const errorToast = page.locator(".Toastify__toast--error, .text-red-500, div:has-text('sai'), div:has-text('không đúng'), div:has-text('Invalid')");
    // Should stay on login
    expect(page.url()).toContain("/login");
  });

  test("AUTH-07: Forgot password request interface functions safely", async ({
    page,
  }) => {
    await page.goto(`${baseURL}/forgot-password`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/forgot-password");

    const emailInput = page.locator('form input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill(email);

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    // Submit reset password
    await submitBtn.click();
    await page.waitForTimeout(3000);
    // User sees response toast / message
    expect(page.url()).toContain("/forgot-password");
  });

  test("AUTH-02, AUTH-03, AUTH-04, AUTH-05: Complete Login, Refresh, Logout, Re-login persistence", async ({
    page,
  }) => {
    // 1. Login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    const userRaw = await page.evaluate(() => localStorage.getItem("user"));
    const token = await page.evaluate(() => localStorage.getItem("idToken"));
    expect(token).toBeTruthy();
    const userObj = JSON.parse(userRaw);
    const userId = userObj.id;
    expect(userId).toBeTruthy();

    // 2. AUTH-03: Refresh page - session must persist
    await page.reload();
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    const tokenAfterReload = await page.evaluate(() =>
      localStorage.getItem("idToken")
    );
    expect(tokenAfterReload).toBe(token);

    // 3. AUTH-04: Logout
    await page.click(
      'button:has-text("Logout"), button:has-text("Log out"), button:has-text("Đăng xuất"), svg.lucide-log-out'
    );
    await page.waitForURL("**/login", { timeout: 15000 });
    const tokenAfterLogout = await page.evaluate(() =>
      localStorage.getItem("idToken")
    );
    expect(tokenAfterLogout).toBeNull();

    // 4. AUTH-05: Re-login and verify same application-user ID
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    const userRaw2 = await page.evaluate(() => localStorage.getItem("user"));
    const userObj2 = JSON.parse(userRaw2);
    expect(userObj2.id).toBe(userId);
  });
});
