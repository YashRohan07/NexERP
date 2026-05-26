import api from "./axios";

export function getPosProducts(params = {}) {
  return api.get("/pos/products", { params });
}

export function checkoutPos(payload) {
  return api.post("/pos/checkout", payload);
}

export function getPosReceipt(saleId) {
  return api.get(`/pos/receipt/${saleId}`);
}
