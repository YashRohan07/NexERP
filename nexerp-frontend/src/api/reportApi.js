import api from "./axios";

export function getReportSummary(params = {}) {
  return api.get("/reports/summary", { params });
}

export function getSalesReport(params = {}) {
  return api.get("/reports/sales", { params });
}

export function getPurchasesReport(params = {}) {
  return api.get("/reports/purchases", { params });
}

export function getInventoryReport(params = {}) {
  return api.get("/reports/inventory", { params });
}

export function getLowStockReport(params = {}) {
  return api.get("/reports/low-stock", { params });
}

export function downloadSalesReportPdf(params = {}) {
  return api.get("/reports/sales/pdf", {
    params,
    responseType: "blob",
  });
}

export function downloadPurchasesReportPdf(params = {}) {
  return api.get("/reports/purchases/pdf", {
    params,
    responseType: "blob",
  });
}

export function downloadInventoryReportPdf(params = {}) {
  return api.get("/reports/inventory/pdf", {
    params,
    responseType: "blob",
  });
}

export function downloadLowStockReportPdf(params = {}) {
  return api.get("/reports/low-stock/pdf", {
    params,
    responseType: "blob",
  });
}
