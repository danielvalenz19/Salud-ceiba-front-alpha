import api from "@/src/services/api";

export type Territorio = { territorio_id: number; nombre: string }

export async function listTerritorios(): Promise<Territorio[]> {
  const { data } = await api.get<{ data?: Territorio[]; territorios?: Territorio[] }>("/territorios")
  // Compatibilidad con múltiples formatos
  return (data as any)?.data ?? (data as any)?.territorios ?? []
}
