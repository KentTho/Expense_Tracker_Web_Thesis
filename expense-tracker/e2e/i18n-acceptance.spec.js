import { test, expect } from "@playwright/test";

test.describe("Wave05B: Native i18n Acceptance (No Google Translate)", () => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const baseURL =
    process.env.E2E_BASE_URL ||
    "https://expense-tracker-web-thesis.vercel.app";

  test.beforeEach(async ({ page }) => {
    // Monitor network requests to ensure ZERO requests to google translate
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("translate.google.com") || url.includes("google_translate")) {
        throw new Error(`Forbidden Google Translate request detected: ${url}`);
      }
    });

    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 35000 });
  });

  test("I18N-01 to I18N-07: Switch EN <-> VI instantly without page reload, verify persistence and zero Google Translate calls", async ({
    page,
  }) => {
    // 1. Locate LanguageSwitcher buttons
    const viBtn = page.locator('button:has-text("VI"), button:has-text("🇻🇳")').first();
    const enBtn = page.locator('button:has-text("EN"), button:has-text("🇺🇸")').first();

    await expect(viBtn).toBeVisible({ timeout: 10000 });
    await expect(enBtn).toBeVisible({ timeout: 10000 });

    // 2. Click VI button (Instantaneous switch to Vietnamese)
    await viBtn.click();
    await page.waitForTimeout(500);

    // Verify document.documentElement.lang is vi
    const docLangVi = await page.evaluate(() => document.documentElement.lang);
    expect(docLangVi).toBe("vi");

    // Verify localStorage has app_language = vi
    const storedLangVi = await page.evaluate(() => localStorage.getItem("app_language"));
    expect(storedLangVi).toBe("vi");

    // Verify navigation label translated (e.g. Tổng quan, Thu nhập, Chi tiêu, Đăng xuất)
    const logoutVi = page.getByText("Đăng xuất").first();
    await expect(logoutVi).toBeVisible();

    // 3. Click EN button (Instantaneous switch to English)
    await enBtn.click();
    await page.waitForTimeout(500);

    const docLangEn = await page.evaluate(() => document.documentElement.lang);
    expect(docLangEn).toBe("en");

    const storedLangEn = await page.evaluate(() => localStorage.getItem("app_language"));
    expect(storedLangEn).toBe("en");

    const logoutEn = page.getByText("Logout").first();
    await expect(logoutEn).toBeVisible();

    // 4. Reload page - verify language persists from localStorage
    await page.reload();
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    const persistedLang = await page.evaluate(() => localStorage.getItem("app_language"));
    expect(persistedLang).toBe("en");
    const persistedDocLang = await page.evaluate(() => document.documentElement.lang);
    expect(persistedDocLang).toBe("en");
  });
});
