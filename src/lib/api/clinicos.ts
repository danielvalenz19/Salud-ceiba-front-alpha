import api from "./client";

// Slugs aceptados por el backend (rutas /api/v1/{slug}/...)
export type ModuleSlug = "vacunacion" | "nutricion" | "saludreproductiva" | "epidemiologia";

// -------- Tipos --------
export interface Indicador {
  ind_id: number;
  nombre: string;
  modulo?: ModuleSlug;
}

export interface Sector {
  sector_id: number;
  nombre: string;
}

export interface CreateEventoPayload {
  persona_id?: number | null;
  sector_id: number;
  ind_id: number;
  valor_num?: number;
  valor_texto?: string;
  lote?: string;
  fecha_evento: string;
  responsable_id: number;
  detalle_json?: Record<string, any>;
}

// -------- Indicadores por módulo --------
export async function getIndicadoresByModulo(slug: ModuleSlug): Promise<Indicador[]> {
  try {
    const { data } = await api.get(`/` + `${slug}` + `/indicadores`);
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch {
    const { data } = await api.get(`/indicadores`, { params: { modulo: slug } });
    return Array.isArray(data) ? data : (data?.data ?? []);
  }
}

// -------- Crear evento (por módulo) --------
export async function createEventoClinico(slug: ModuleSlug, payload: CreateEventoPayload) {
  const body: CreateEventoPayload = {
    ...payload,
    persona_id: payload.persona_id ?? null,
    sector_id: Number(payload.sector_id),
    ind_id: Number(payload.ind_id),
    valor_num: payload.valor_num !== undefined ? Number(payload.valor_num) : undefined,
  };
  const { data } = await api.post(`/${slug}/eventos`, body);
  return data;
}

// -------- Listar sectores (para el select) --------
export async function listSectores(): Promise<Sector[]> {
  const { data } = await api.get(`/sectores`, { params: { page: 1, limit: 500 } });
  return Array.isArray(data) ? data : (data?.data ?? []);
}
