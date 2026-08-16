const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("fitlife_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Something went wrong");
  }

  return data;
}