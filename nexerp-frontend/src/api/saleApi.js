import api from "./axios";

export function getSales(params = {}) {
  return api.get("/sales", { params });
}

export function getSale(id) {
  return api.get(`/sales/${id}`);
}

export function createSale(payload) {
  return api.post("/sales", payload);
}

export function confirmSale(id) {
  return api.patch(`/sales/${id}/confirm`);
}

export function cancelSale(id) {
  return api.patch(`/sales/${id}/cancel`);
}
