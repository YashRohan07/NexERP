import axios from "axios";
import api from "./axios";

const API_BASE_URL = "https://api.devexait.com";

export async function login(payload) {
  await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });

  return api.post("/auth/login", payload);
}

export function logout() {
  return api.post("/auth/logout");
}

export function getAuthUser() {
  return api.get("/auth/me");
}