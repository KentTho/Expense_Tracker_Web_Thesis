import { authorizedFetch } from "./api";

export async function getRecentTransactions(limit = 5) {
  return authorizedFetch(`/transactions/recent?limit=${limit}`, {
    method: "GET",
  });
}
