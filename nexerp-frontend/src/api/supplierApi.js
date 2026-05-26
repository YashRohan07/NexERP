import api from "./axios";

export function getSuppliers(params = {}) {
  return api.get("/suppliers", { params });
}

export function getSupplier(id) {
  return api.get(`/suppliers/${id}`);
}

export function createSupplier(payload) {
  return api.post("/suppliers", payload);
}

export function updateSupplier(id, payload) {
  return api.put(`/suppliers/${id}`, payload);
}

export function deleteSupplier(id) {
  return api.delete(`/suppliers/${id}`);
}
