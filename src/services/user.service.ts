import api from "@/src/services/api"

// Perfil actual (GET)
export async function getMe() {
  const { data } = await api.get("/users/me")
  return (data as any)?.data || data
}

// Actualizar perfil (PUT)
export async function updateMe(payload: {
  nombre?: string
  telefono?: string
  avatar_url?: string
  puesto?: string
}) {
  const { data } = await api.put("/users/me", payload)
  return (data as any)?.data || data
}

// Cambiar contraseña (PUT)
export async function changeMyPassword(current_password: string, new_password: string) {
  await api.put("/users/me/password", { current_password, new_password })
}
