import api from "./axios";

export function getInventory(params = {}) {
  return api.get("/inventory", { params });
}

export function adjustStock(productId, payload) {
  return api.patch(`/inventory/${productId}/adjust-stock`, payload);
}
