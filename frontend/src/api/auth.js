import { getAccessToken, getRefreshToken } from "./token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function loginAdmin({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "로그인에 실패했습니다.");
  }

  return data;
}

export async function fetchMe() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("액세스 토큰이 없습니다.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "사용자 정보를 불러오지 못했습니다.");
  }

  return data;
}

export async function updateMe({ username = null, email = null, password = null }) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("액세스 토큰이 없습니다.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "계정 정보를 수정하지 못했습니다.");
  }

  return data;
}

export async function logoutAdmin() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return true;
  }

  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "로그아웃에 실패했습니다.");
  }

  return true;
}
