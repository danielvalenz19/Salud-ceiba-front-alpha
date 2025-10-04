// Thin wrapper to expose a shared axios instance with Authorization header
// Reuses the existing client at src/lib/api/client.ts
import api from "@/src/lib/api/client";

export default api;
