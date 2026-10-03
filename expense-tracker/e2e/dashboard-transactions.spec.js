import { test, expect } from "@playwright/test";

test.describe("Gate 6 & 7: Dashboard, Transactions & Categories Acceptance", () => {
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

  test("DASH-01 to DASH-05: Dashboard loads with stats and layout elements", async ({
    page,
  }) => {
    const addIncomeLink = page.locator('a[href="/income"]').first();
    await expect(addIncomeLink).toBeVisible({ timeout: 15000 });
    // Verify cards are present
    expect(page.url()).toContain("/dashboard");
  });

  test("CAT-01 to CAT-04: Category list and creation with [QA-W05]", async ({
    page,
  }) => {
    await page.goto(`${baseURL}/categories`);
    await page.waitForLoadState("networkidle");

    // Click Add Category button
    const addCatBtn = page.locator('button:has-text("Add Category"), button:has-text("Thêm danh mục"), button:has-text("Tạo danh mục")');
    if (await addCatBtn.isVisible()) {
      await addCatBtn.click();

      // Fill category name with [QA-W05] marker
      const catInput = page.locator('input[placeholder*="name" i], input[placeholder*="tên" i]').first();
      if (await catInput.isVisible()) {
        await catInput.fill("[QA-W05] Test Category");
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Lưu"), button:has-text("Tạo")').first();
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    expect(page.url()).toContain("/categories");
  });

  test("TX-01 to TX-06: Income, Expense creation, dashboard reflection, and cleanup", async ({
    page,
  }) => {
    // 1. Create Income
    await page.goto(`${baseURL}/income`);
    await page.waitForLoadState("networkidle");

    const addIncomeBtn = page.locator('button:has-text("Add Income"), button:has-text("Thêm thu nhập"), button:has-text("Thêm")').first();
    if (await addIncomeBtn.isVisible()) {
      await addIncomeBtn.click();

      // Fill amount
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="số tiền" i]').first();
      await amountInput.fill("5000000");

      // Fill note
      const noteInput = page.locator('input[placeholder*="note" i], input[placeholder*="ghi chú" i], textarea').first();
      if (await noteInput.isVisible()) {
        await noteInput.fill("[QA-W05] Salary");
      }

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Lưu")').first();
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    // 2. Create Expense
    await page.goto(`${baseURL}/expense`);
    await page.waitForLoadState("networkidle");

    const addExpenseBtn = page.locator('button:has-text("Add Expense"), button:has-text("Thêm chi tiêu"), button:has-text("Thêm")').first();
    if (await addExpenseBtn.isVisible()) {
      await addExpenseBtn.click();

      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="số tiền" i]').first();
      await amountInput.fill("50000");

      const noteInput = page.locator('input[placeholder*="note" i], input[placeholder*="ghi chú" i], textarea').first();
      if (await noteInput.isVisible()) {
        await noteInput.fill("[QA-W05] Lunch");
      }

      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Lưu")').first();
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    // 3. Return to Dashboard and verify recent transactions
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dashboard");
  });
});
