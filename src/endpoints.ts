const RAW = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1"
const API_BASE = RAW.replace(/\/+$/, "")

export const ENDPOINTS = {
  causas: `${API_BASE}/causas`,
  territorios: `${API_BASE}/territorios`,
  morbilidad: {
    casos: `${API_BASE}/morbilidad/casos`,
  },
} as const

export type EndpointKey = keyof typeof ENDPOINTS
