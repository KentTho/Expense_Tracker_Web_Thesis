import { authorizedFetch, getAccessToken } from "./api";

export const getToken = getAccessToken;

function normalizeCategory(category) {
  if (!category) {
    return category;
  }

  return {
    ...category,
    emoji: category.emoji || category.icon || null,
  };
}

function normalizeIncome(item) {
  return {
    ...item,
    emoji: item?.emoji || item?.category?.icon || null,
    icon: item?.icon || item?.emoji || item?.category?.icon || null,
    category: normalizeCategory(item?.category),
    category_name: item?.category_name || item?.category?.name || "Uncategorized",
  };
}

function buildIncomePayload(form) {
  return {
    amount: Number(form.amount),
    date: form.date,
    category_name: form.category_name || null,
    category_id: form.category_id || null,
    emoji: form.emoji || null,
    currency_code: form.currency_code || "USD",
    note: form.note || "",
  };
}

export async function createIncome(data) {
  const response = await authorizedFetch("/incomes", {
    method: "POST",
    body: JSON.stringify(buildIncomePayload(data)),
  });
  return normalizeIncome(response);
}

export async function getIncomes() {
  const data = await authorizedFetch("/incomes", { method: "GET" });
  return Array.isArray(data?.items) ? data.items.map(normalizeIncome) : [];
}

export async function updateIncome(id, data) {
  const response = await authorizedFetch(`/incomes/${id}`, {
    method: "PUT",
    body: JSON.stringify(buildIncomePayload(data)),
  });
  return normalizeIncome(response);
}

export async function deleteIncome(id) {
  return authorizedFetch(`/incomes/${id}`, { method: "DELETE" });
}

export async function getIncomeSummary() {
  return authorizedFetch("/incomes/summary", { method: "GET" });
}

export async function getFinancialKpiSummary() {
  return authorizedFetch("/summary/kpis", { method: "GET" });
}
