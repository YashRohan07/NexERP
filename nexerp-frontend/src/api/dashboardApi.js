import api from "./axios";

export function getDashboardSummary() {
  return api.get("/dashboard/summary");
}
