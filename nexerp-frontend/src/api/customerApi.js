import api from "./axios";

export function getCustomers(params = {}) {
  return api.get("/customers", { params });
}

export function getCustomer(id) {
  return api.get(`/customers/${id}`);
}

export function createCustomer(payload) {
  return api.post("/customers", payload);
}

export function updateCustomer(id, payload) {
  return api.put(`/customers/${id}`, payload);
}

export function deleteCustomer(id) {
  return api.delete(`/customers/${id}`);
}
