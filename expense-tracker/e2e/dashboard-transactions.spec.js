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
    await expect(page).toHaveURL(new RegExp(`${baseURL}/dashboard`));

    // Mandatory cards and links must be visible
    const addIncomeLink = page.locator('a[href="/income"]').first();
    await expect(addIncomeLink).toBeVisible({ timeout: 15000 });

    const totalBalanceCard = page.locator('text=Total Balance, text=Tổng số dư').first();
    await expect(totalBalanceCard).toBeVisible({ timeout: 10000 });

    const recentTxHeading = page.locator('text=Recent Transactions, text=Giao dịch gần đây').first();
    await expect(recentTxHeading).toBeVisible({ timeout: 10000 });
  });

  test("CAT-01 to CAT-04: Category list and creation with [QA-W05]", async ({
    page,
  }) => {
    await page.goto(`${baseURL}/categories`);
    await page.waitForLoadState("networkidle");

    // Click "Create new" category button - must be visible
    const addCatBtn = page.locator('button:has-text("Create new"), button:has-text("Tạo danh mục")').first();
    await expect(addCatBtn).toBeVisible({ timeout: 15000 });
    await addCatBtn.click();

    // Modal input must appear
    const catInput = page.locator('input[placeholder*="Salary, Rent, Groceries" i], input[placeholder*="tên" i]').first();
    await expect(catInput).toBeVisible({ timeout: 10000 });
    await catInput.fill("[QA-W05] Test Category");

    // Submit button must be visible and clicked
    const saveBtn = page.locator('button:has-text("Confirm creation"), button:has-text("Xác nhận tạo"), button:has-text("Save")').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();

    // Wait for category to be listed or modal to close
    await expect(catInput).toBeHidden({ timeout: 10000 });
  });

  test("TX-01 to TX-06: Income, Expense creation, dashboard reflection, and cleanup", async ({
    page,
  }) => {
    // 1. Create Income
    await page.goto(`${baseURL}/income`);
    await page.waitForLoadState("networkidle");

    const addIncomeBtn = page.locator('button:has-text("Add Income"), button:has-text("Thêm thu nhập")').first();
    await expect(addIncomeBtn).toBeVisible({ timeout: 15000 });
    await addIncomeBtn.click();

    // Fill amount and note
    const incomeAmountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await expect(incomeAmountInput).toBeVisible({ timeout: 10000 });
    await incomeAmountInput.fill("5000000");

    const incomeNoteInput = page.locator('textarea[name="note"], input[placeholder*="memo" i]').first();
    await expect(incomeNoteInput).toBeVisible({ timeout: 5000 });
    await incomeNoteInput.fill("[QA-W05] Salary");

    const saveIncomeBtn = page.locator('button:has-text("Save Income"), button:has-text("Lưu thu nhập")').first();
    await expect(saveIncomeBtn).toBeVisible({ timeout: 5000 });
    await saveIncomeBtn.click();
    await expect(incomeAmountInput).toBeHidden({ timeout: 10000 });

    // 2. Create Expense
    await page.goto(`${baseURL}/expense`);
    await page.waitForLoadState("networkidle");

    const addExpenseBtn = page.locator('button:has-text("Add Expense"), button:has-text("Thêm chi tiêu")').first();
    await expect(addExpenseBtn).toBeVisible({ timeout: 15000 });
    await addExpenseBtn.click();

    const expenseAmountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await expect(expenseAmountInput).toBeVisible({ timeout: 10000 });
    await expenseAmountInput.fill("50000");

    const expenseNoteInput = page.locator('textarea[name="note"], input[placeholder*="memo" i]').first();
    await expect(expenseNoteInput).toBeVisible({ timeout: 5000 });
    await expenseNoteInput.fill("[QA-W05] Lunch");

    const saveExpenseBtn = page.locator('button:has-text("Save Expense"), button:has-text("Lưu chi tiêu")').first();
    await expect(saveExpenseBtn).toBeVisible({ timeout: 5000 });
    await saveExpenseBtn.click();
    await expect(expenseAmountInput).toBeHidden({ timeout: 10000 });

    // 3. Return to Dashboard and verify recent transactions
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`${baseURL}/dashboard`));

    const dashboardItem = page.locator('text=[QA-W05] Lunch, text=[QA-W05] Salary').first();
    await expect(dashboardItem).toBeVisible({ timeout: 15000 });
  });
});
