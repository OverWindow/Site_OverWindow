import { getAccessToken } from "./token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getDevelopmentRecommendations(payload) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Login required.");
  }

  const response = await fetch(`${API_BASE_URL}/ai/development-recommendations`, {
    method: "POST",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load recommendations.");
  }

  return data;
}
