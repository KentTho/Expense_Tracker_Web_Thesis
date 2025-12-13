// src/services/api.js
export const BACKEND_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function createIncome(idToken, payload) {
  const res = await fetch(`${BACKEND_BASE}/incomes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listIncomes(idToken) {
  const res = await fetch(`${BACKEND_BASE}/incomes`, {
    headers: { "Authorization": `Bearer ${idToken}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createExpense(idToken, payload) {
  const res = await fetch(`${BACKEND_BASE}/expenses`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listExpenses(idToken) {
  const res = await fetch(`${BACKEND_BASE}/expenses`, {
    headers: { "Authorization": `Bearer ${idToken}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
