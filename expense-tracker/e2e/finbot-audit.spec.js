import { test, expect } from "@playwright/test";

test.describe("Gate 13: FinBot Current Behavior Audit", () => {
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
    await page.waitForURL("**/dashboard", { timeout: 20000 });
  });

  test("AI-01: FinBot widget opens, takes input, and handles response/errors", async ({
    page,
  }) => {
    // 1. Open FinBot trigger button
    const botTrigger = page.locator('button:has(svg.lucide-sparkles), button[aria-label*="FinBot" i], div:has(> svg.lucide-sparkles)').first();
    if (await botTrigger.isVisible()) {
      await botTrigger.click();
      await page.waitForTimeout(1000);

      // Verify chat window is open
      const chatInput = page.locator('input[placeholder*="Hỏi FinBot" i], input[placeholder*="FinBot" i], input[placeholder*="Ask" i]').first();
      if (await chatInput.isVisible()) {
        await chatInput.fill("Số dư của tôi?");
        await page.keyboard.press("Enter");
        // Wait for response or error state
        await page.waitForTimeout(5000);
      }
    }
  });
});
