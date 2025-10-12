export function authFetch(url: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  const headers = new Headers(init.headers || {})
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  return fetch(url, { ...init, headers, credentials: "include" })
}
