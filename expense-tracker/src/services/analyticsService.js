import { authorizedFetch, buildQuery } from "./api";

export async function getAnalyticsSummary(filters = {}) {
  const query = buildQuery({
    type: filters.type || "all",
    start_date: filters.startDate,
    end_date: filters.endDate,
    category_id: filters.categoryId,
  });

  return authorizedFetch(`/analytics/summary${query}`, {
    method: "GET",
  });
}

export async function getRecentTransactions(limit = 5) {
  return authorizedFetch(`/transactions/recent?limit=${limit}`, {
    method: "GET",
  });
}
