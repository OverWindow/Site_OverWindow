const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const IS_ADMIN_KEY = "is_admin";

export function setAuthData({ access_token, refresh_token, is_admin = true }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  localStorage.setItem(IS_ADMIN_KEY, String(is_admin));
}

export function clearAuthData() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(IS_ADMIN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getIsAdmin() {
  return localStorage.getItem(IS_ADMIN_KEY) === "true";
}

export function isLoggedIn() {
  return !!getAccessToken();
}

export function hasAuthTokens() {
  return !!getAccessToken() && !!getRefreshToken();
}