import { authorizedFetch } from "./api";

function normalizeCategory(category) {
  if (!category) {
    return category;
  }

  return {
    ...category,
    emoji: category.emoji || category.icon || null,
  };
}

function normalizeExpense(item) {
  return {
    ...item,
    emoji: item?.emoji || item?.category?.icon || null,
    icon: item?.icon || item?.emoji || item?.category?.icon || null,
    category: normalizeCategory(item?.category),
    category_name: item?.category_name || item?.category?.name || "Uncategorized",
  };
}

function buildExpensePayload(form) {
  return {
    category_id: form.category_id || null,
    category_name: form.category_name || null,
    amount: Number(form.amount),
    date: form.date,
    emoji: form.emoji || null,
    currency_code: form.currency_code || "USD",
    note: form.note || "",
  };
}

export async function createExpense(data) {
  const response = await authorizedFetch("/expenses/", {
    method: "POST",
    body: JSON.stringify(buildExpensePayload(data)),
  });
  return normalizeExpense(response);
}

export async function getExpenses() {
  const data = await authorizedFetch("/expenses/", { method: "GET" });
  return {
    ...data,
    items: Array.isArray(data?.items) ? data.items.map(normalizeExpense) : [],
  };
}

export async function updateExpense(id, data) {
  const response = await authorizedFetch(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(buildExpensePayload(data)),
  });
  return normalizeExpense(response);
}

export async function deleteExpense(id) {
  return authorizedFetch(`/expenses/${id}`, { method: "DELETE" });
}

export async function getExpenseDailyTrend(days = 30) {
  return authorizedFetch(`/expenses/summary/expense-trend/daily?days=${days}`, {
    method: "GET",
  });
}

export async function getExpenseBreakdown() {
  return authorizedFetch("/expenses/summary", { method: "GET" });
}
