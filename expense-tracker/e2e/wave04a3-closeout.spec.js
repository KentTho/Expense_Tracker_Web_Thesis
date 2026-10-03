import { test, expect } from "@playwright/test";

test.describe("Wave04A3 Fast Closeout: Live Trust Chain", () => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const baseURL =
    process.env.E2E_BASE_URL ||
    "https://expense-tracker-web-thesis.vercel.app";

  test("01: Backend CORS preflight & health check", async ({ request }) => {
    const backendURL = "https://expense-tracker-web-thesis-1.onrender.com";

    // OPTIONS /auth/sync preflight
    const preflight = await request.fetch(`${backendURL}/auth/sync`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://expense-tracker-web-thesis.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

    expect(preflight.status()).toBe(200);
    const allowOrigin = preflight.headers()["access-control-allow-origin"];
    expect(allowOrigin).toBe("https://expense-tracker-web-thesis.vercel.app");

    // System health
    const sysHealth = await request.get(`${backendURL}/system/health`);
    expect(sysHealth.status()).toBe(200);
    const healthJson = await sysHealth.json();
    expect(healthJson.db_status).toBe("Active");
  });

  test("02: Live browser QA user signup/login, session recovery, same identity", async ({
    page,
  }) => {
    test.skip(!email || !password, "QA credentials missing");

    // 1. Visit signup page
    await page.goto(`${baseURL}/signup`);
    await page.waitForLoadState("networkidle");

    // Check if we need to sign up or if user already exists
    // Try signup first with Antigravity QA
    await page.fill('input[placeholder="John Doe"]', "Antigravity QA");
    await page.fill('input[placeholder="name@example.com"]', email);
    await page.fill('input[placeholder="Create a strong password"]', password);
    await page.fill('input[placeholder="Re-enter your password"]', password);

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for either navigation to /dashboard or error (e.g. email already exists)
    try {
      await page.waitForURL("**/dashboard", { timeout: 15000 });
    } catch {
      // If email exists, navigate to /login and login
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState("networkidle");
      await page.fill('input[placeholder="Enter your email"]', email);
      await page.fill('input[placeholder="••••••••"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard", { timeout: 20000 });
    }

    // Verify localStorage has idToken and user
    const userSessionStr = await page.evaluate(() =>
      localStorage.getItem("user")
    );
    const idToken = await page.evaluate(() => localStorage.getItem("idToken"));

    expect(idToken).toBeTruthy();
    expect(userSessionStr).toBeTruthy();
    const user1 = JSON.parse(userSessionStr);
    expect(user1.email).toBe(email);
    const userId1 = user1.id;
    expect(userId1).toBeTruthy();

    // 2. Logout
    // Locate logout button in sidebar
    await page.click('button:has-text("Logout"), button:has-text("Log out"), button:has-text("Đăng xuất"), svg.lucide-log-out');
    await page.waitForURL("**/login", { timeout: 15000 });

    // Verify localStorage is cleared
    const tokenAfterLogout = await page.evaluate(() =>
      localStorage.getItem("idToken")
    );
    expect(tokenAfterLogout).toBeNull();

    // 3. Login again
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    // Verify same application-user ID
    const userSessionStr2 = await page.evaluate(() =>
      localStorage.getItem("user")
    );
    const user2 = JSON.parse(userSessionStr2);
    expect(user2.id).toBe(userId1);
    expect(user2.email).toBe(email);
  });
});
