import { authorizedFetch, buildQuery } from "./api";

export async function adminGetAllUsers(skip = 0, limit = 100) {
  return authorizedFetch(`/admin/users${buildQuery({ skip, limit })}`, {
    method: "GET",
  });
}

export async function adminUpdateUser(userId, data) {
  return authorizedFetch(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteUser(userId) {
  return authorizedFetch(`/admin/users/${userId}`, { method: "DELETE" });
}

export async function adminGetGlobalKPIs() {
  return authorizedFetch("/admin/kpis", { method: "GET" });
}

export async function adminGetGlobalUserGrowth(days = 30) {
  return authorizedFetch(`/admin/charts/user-growth?days=${days}`, { method: "GET" });
}

export async function adminGetDefaultCategories(type = null) {
  return authorizedFetch(`/admin/categories${buildQuery({ type })}`, { method: "GET" });
}

export async function adminCreateDefaultCategory(payload) {
  return authorizedFetch("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateDefaultCategory(id, payload) {
  return authorizedFetch(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteDefaultCategory(id) {
  return authorizedFetch(`/admin/categories/${id}`, { method: "DELETE" });
}

export async function getSystemSettings() {
  return authorizedFetch("/system/settings", { method: "GET" });
}

export async function fetchSystemSettings() {
  return authorizedFetch("/system/settings", { method: "GET" });
}

export async function updateSystemSettings(data) {
  return authorizedFetch("/system/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminGetAuditLogs(limit = 50, skip = 0) {
  return authorizedFetch(`/admin/logs${buildQuery({ skip, limit })}`, {
    method: "GET",
  });
}

export async function adminGetSystemHealth() {
  return authorizedFetch("/system/health", { method: "GET" });
}
