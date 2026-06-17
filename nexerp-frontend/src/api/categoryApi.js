import api from "./axios";

export function getCategories(params = {}) {
  return api.get("/categories", { params });
}

export function getAllCategories() {
  return api.get("/categories/all");
}

export function createCategory(payload) {
  return api.post("/categories", payload);
}

export function updateCategory(id, payload) {
  return api.put(`/categories/${id}`, payload);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`);
}
