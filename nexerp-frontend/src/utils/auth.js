const TOKEN_KEY = "nexerp_token";
const USER_KEY = "nexerp_user";

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function logout() {
  clearAuth();
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getRole() {
  return getUser()?.role || "";
}

export function isAdmin() {
  return String(getRole()).toLowerCase() === "admin";
}

export function isMember() {
  return String(getRole()).toLowerCase() === "member";
}
