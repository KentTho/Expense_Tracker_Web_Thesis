import { authorizedFetch, buildQuery } from "./api";

function normalizeCategory(category) {
  if (!category) {
    return category;
  }

  return {
    ...category,
    emoji: category.emoji || category.icon || null,
  };
}

export async function getCategories(type) {
  const data = await authorizedFetch(`/categories/${buildQuery({ type })}`, { method: "GET" });
  return Array.isArray(data) ? data.map(normalizeCategory) : [];
}

export async function createCategory(payload) {
  const data = await authorizedFetch("/categories/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeCategory(data);
}

export async function updateCategory(id, payload) {
  const data = await authorizedFetch(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizeCategory(data);
}

export async function deleteCategory(id) {
  return authorizedFetch(`/categories/${id}`, {
    method: "DELETE",
  });
}
