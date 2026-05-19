import { getAccessToken } from "./token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

function getMultipartHeaders() {
  const token = getAccessToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPublicProjects() {
  const response = await fetch(`${API_BASE_URL}/projects/public`, {
    method: "GET",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "프로젝트 목록을 불러오지 못했습니다.");
  }

  return data;
}

export async function getAdminProjects() {
  const response = await fetch(`${API_BASE_URL}/projects/admin`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "관리자 프로젝트 목록을 불러오지 못했습니다.");
  }

  return data;
}

export async function createProject(payload) {
  const response = await fetch(`${API_BASE_URL}/projects/admin`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "프로젝트 생성에 실패했습니다.");
  }

  return data;
}

export async function updateProject(projectId, payload) {
  const response = await fetch(`${API_BASE_URL}/projects/admin/${projectId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "프로젝트 수정에 실패했습니다.");
  }

  return data;
}

export async function deleteProject(projectId) {
  const response = await fetch(`${API_BASE_URL}/projects/admin/${projectId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw new Error(data?.detail || "프로젝트 삭제에 실패했습니다.");
  }

  return true;
}

export async function uploadProjectImage(projectId, payload) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("alt_text", payload.alt_text || "");
  formData.append("caption", payload.caption || "");
  formData.append("image_type", payload.image_type || "screenshot");
  formData.append("is_thumbnail", String(!!payload.is_thumbnail));
  formData.append("sort_order", String(Number(payload.sort_order) || 0));

  const response = await fetch(`${API_BASE_URL}/projects/admin/${projectId}/images`, {
    method: "POST",
    headers: getMultipartHeaders(),
    body: formData,
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "프로젝트 이미지 업로드에 실패했습니다.");
  }

  return data;
}

export async function updateProjectImage(imageId, payload) {
  const response = await fetch(`${API_BASE_URL}/projects/admin/images/${imageId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "프로젝트 이미지 수정에 실패했습니다.");
  }

  return data;
}

export async function deleteProjectImage(imageId) {
  const response = await fetch(`${API_BASE_URL}/projects/admin/images/${imageId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw new Error(data?.detail || "프로젝트 이미지 삭제에 실패했습니다.");
  }

  return true;
}
