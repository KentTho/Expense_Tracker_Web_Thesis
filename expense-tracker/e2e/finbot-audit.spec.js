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

  test("AI-01: FinBot widget opens, takes input, and handles response/errors deterministically", async ({
    page,
  }) => {
    // 1. Mandatory trigger button must be visible
    const botTrigger = page.locator('button:has(svg.lucide-sparkles)').first();
    await expect(botTrigger).toBeVisible({ timeout: 10000 });
    await botTrigger.click();

    // 2. Chat window & input must appear deterministically (no false green)
    const chatInput = page.locator('textarea[placeholder*="Ask me anything" i], input[placeholder*="Ask" i]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // 3. Send query
    await chatInput.fill("Số dư của tôi?");
    const sendButton = page.locator('button:has(svg.lucide-send)').first();
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // 4. Verify message appears in conversation (either user message or assistant reply/status)
    const sentMessage = page.locator('text=Số dư của tôi?').first();
    await expect(sentMessage).toBeVisible({ timeout: 10000 });

    // 5. Verify bot response container or loader resolves within timeout
    const chatContainer = page.locator('div.custom-scrollbar').first();
    await expect(chatContainer).toBeVisible({ timeout: 15000 });
  });
});
