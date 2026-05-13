import { authorizedFetch } from "./api";

/**
 * Fetch main dashboard data including summary metrics and system settings.
 * Backend contract: GET /dashboard/data
 * Response: { summary: { total_income, total_expense, balance, budget_limit, spent_this_month, remaining_budget }, recent_transactions, ... }
 */
export async function getDashboardData() {
  return authorizedFetch("/dashboard/data", { method: "GET" });
}
