import { getAccessToken } from "./token";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getAuthHeaders() {
  const token = getAccessToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPublicLinks() {
  console.log('MODE =', import.meta.env.MODE);
  console.log('VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL);
  console.log('ALL_ENV =', import.meta.env);
  console.log(API_BASE_URL)
  const response = await fetch(`${API_BASE_URL}/links/public`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "사이트 목록을 불러오지 못했습니다.");
  }

  return data;
}

export async function getAdminCategories() {
  const response = await fetch(`${API_BASE_URL}/links/admin/categories`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "관리자 데이터를 불러오지 못했습니다.");
  }

  return data;
}

export async function createCategory(payload) {
  const response = await fetch(`${API_BASE_URL}/links/admin/categories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "카테고리 생성에 실패했습니다.");
  }

  return data;
}

export async function updateCategory(categoryId, payload) {
  const response = await fetch(`${API_BASE_URL}/links/admin/categories/${categoryId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "카테고리 수정에 실패했습니다.");
  }

  return data;
}

export async function deleteCategory(categoryId) {
  const response = await fetch(`${API_BASE_URL}/links/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw new Error(data?.detail || "카테고리 삭제에 실패했습니다.");
  }

  return true;
}

export async function createLink(payload) {
  const response = await fetch(`${API_BASE_URL}/links/admin/items`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "링크 생성에 실패했습니다.");
  }

  return data;
}

export async function updateLink(linkId, payload) {
  const response = await fetch(`${API_BASE_URL}/links/admin/items/${linkId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "링크 수정에 실패했습니다.");
  }

  return data;
}

export async function deleteLink(linkId) {
  const response = await fetch(`${API_BASE_URL}/links/admin/items/${linkId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw new Error(data?.detail || "링크 삭제에 실패했습니다.");
  }

  return true;
}