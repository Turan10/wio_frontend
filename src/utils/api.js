import { getAuthToken as getToken, storeAuthToken as storeToken } from "./auth";

export const BACKEND_URL = "http://192.168.86.22:8080";

export async function apiGet(url) {
  const token = await getToken();
  console.log("apiGet:", url, "token:", token);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  console.log("apiGet response status:", res.status);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.log("apiGet error for", url, err);
    throw new Error(err.message || "Request failed");
  }
  const data = await res.json();
  console.log("apiGet data from:", url, data);
  return data;
}

export async function apiPost(url, body) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export async function apiPut(url, body) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export async function apiDelete(url) {
  const token = await getToken();
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(url, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return;
}

export { getToken as getAuthToken, storeToken as storeAuthToken };
