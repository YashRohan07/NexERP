import api from "./axios";

export function getPurchases(params = {}) {
  return api.get("/purchases", { params });
}

export function getPurchase(id) {
  return api.get(`/purchases/${id}`);
}

export function createPurchase(payload) {
  return api.post("/purchases", payload);
}

export function confirmPurchase(id) {
  return api.patch(`/purchases/${id}/confirm`);
}

export function cancelPurchase(id) {
  return api.patch(`/purchases/${id}/cancel`);
}
