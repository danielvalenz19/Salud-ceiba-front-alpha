import api from "@/src/services/api";

/* ----------------- Catálogos ----------------- */
export async function fetchCausas() {
  const { data } = await api.get("/morbilidad/causas");
  return data as Array<{ causa_id: number; nombre: string }>;
}
export async function fetchTerritorios() {
  const { data } = await api.get("/territorios");
  return data as Array<{ territorio_id: number; nombre: string }>;
}

/* ----------------- Morbilidad ----------------- */
export type MorbilidadRow = {
  causa_id: number;
  causa_nombre?: string;
  territorio_id: number;
  territorio_nombre?: string;
  anio: number;
  mes: number;
  casos: number;
};
export async function getMorbilidadCasos(params: {
  causa_id?: number;
  territorio_id?: number;
  anio?: number;
  mes?: number;
}) {
  const { data } = await api.get("/morbilidad/casos", { params });
  return data as MorbilidadRow[];
}
export async function createMorbilidadCaso(payload: {
  anio: number; mes: number; territorio_id: number;
  datos: Array<{ causa_id: number; grupo_edad?: string | null; casos: number; }>;
}) {
  const { data } = await api.post("/morbilidad/casos", payload);
  return data;
}

/* ----------------- Mortalidad ----------------- */
export type MortalidadAggRow = {
  causa_id: number; causa_nombre?: string;
  territorio_id: number; territorio_nombre?: string;
  anio: number; mes: number; total_defunciones: number;
};
export type MortalidadDetalleRow = {
  registro_id: number; persona_id: number | null;
  causa_id: number; causa_nombre?: string;
  territorio_id: number; territorio_nombre?: string;
  anio: number; mes: number; defunciones: number;
  fecha_defuncion: string; lugar_defuncion?: string | null;
  certificador_id?: number | null; detalle_json?: any; created_at: string;
};
export async function getMortalidadRegistros(params: {
  causa_id?: number; territorio_id?: number; persona_id?: number;
  anio?: number; mes?: number; modo?: "agregado" | "detalle";
  page?: number; limit?: number;
}) {
  const { data } = await api.get("/mortalidad/registros", { params });
  return data as MortalidadAggRow[] | MortalidadDetalleRow[];
}
export async function createMortalidadRegistro(payload: {
  causa_id: number; territorio_id: number; anio: number; mes: number; defunciones: number;
  fecha_defuncion?: string; lugar_defuncion?: string; certificador_id?: number; detalle_json?: any;
}) {
  const { data } = await api.post("/mortalidad/registros", payload);
  return data;
}

/* ----------------- Ambiente ----------------- */
export type AmbienteRow = {
  ind_id: number; territorio_id: number; anio: number; mes: number;
  valor_num: number; valor_den?: number;
};
export async function getAmbienteMetricas(params: {
  ind_id?: number; territorio_id?: number; anio?: number; mes?: number;
}) {
  // si prefieres GET /metricas con filtros, cambia esta ruta
  const { data } = await api.get("/metricas", { params });
  return data as AmbienteRow[];
}
export async function upsertAmbienteMetricas(payload: Array<{
  ind_id: number; territorio_id: number; anio: number; mes: number;
  valor_num: number; valor_den?: number;
}>) {
  const { data } = await api.post("/ambiente/metricas", payload);
  return data;
}
