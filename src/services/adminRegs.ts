import api from "@/src/services/api";

/* ----------------- Catálogos ----------------- */
export async function fetchCausas() {
  // Try new endpoint /causas, fallback to legacy /morbilidad/causas
  try {
    const { data } = await api.get("/causas");
    return data as Array<{ causa_id: number; nombre: string }>;
  } catch {
    const { data } = await api.get("/morbilidad/causas");
    return data as Array<{ causa_id: number; nombre: string }>;
  }
}
export async function fetchTerritorios() {
  const { data } = await api.get("/territorios");
  return data as Array<{ territorio_id: number; nombre: string }>;
}

/* ----------------- Períodos & Meses ----------------- */
export async function fetchAnios(modulo: "morbilidad"|"mortalidad"|"ambiente") {
  const { data } = await api.get(`/periodos/anios`, { params: { modulo } });
  return data as number[];
}

export async function fetchMeses(
  modulo: "morbilidad"|"mortalidad"|"ambiente",
  anio: number,
  territorioId: number | "all" = "all",
) {
  const { data } = await api.get(`/periodos/meses`, { params: { modulo, anio, territorioId } });
  return data as Array<{ value: number; label: string }>;
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
  try {
    const { data } = await api.get("/morbilidad/casos", { params });
    return data as MorbilidadRow[];
  } catch (err) {
    // Fallback to legacy path
    const { data } = await api.get("/salud/morbilidad", { params });
    return data as MorbilidadRow[];
  }
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
  try {
    const { data } = await api.get("/mortalidad/registros", { params });
    return data as MortalidadAggRow[] | MortalidadDetalleRow[];
  } catch (err) {
    // Fallback to legacy path without pagination/modo (if backend doesn't support it)
    const { causa_id, territorio_id, persona_id, anio, mes } = params;
    const legacyParams: any = { causa_id, territorio_id, persona_id, anio, mes };
    const { data } = await api.get("/salud/mortalidad", { params: legacyParams });
    return data as MortalidadAggRow[] | MortalidadDetalleRow[];
  }
}
export async function createMortalidadRegistro(payload: {
  causa_id: number; territorio_id: number; anio: number; mes: number; defunciones: number;
  fecha_defuncion?: string; lugar_defuncion?: string; certificador_id?: number; detalle_json?: any;
}) {
  try {
    const { data } = await api.post("/mortalidad/registros", payload);
    return data;
  } catch (err) {
    // Fallback to legacy path
    const { data } = await api.post("/salud/mortalidad", payload);
    return data;
  }
}

/* ----------------- KPIs ----------------- */
export async function kpiMorbilidad(params: { territorioId?: number|"all"; anio?: number; mes?: number|"all" }) {
  try {
    const { data } = await api.get(`/morbilidad/kpi/total`, { params });
    return data as { total: number };
  } catch {
    const { data } = await api.get(`/salud/morbilidad/kpi/total`, { params });
    return data as { total: number };
  }
}

export async function kpiMortalidad(params: { territorioId?: number|"all"; anio?: number; mes?: number|"all" }) {
  try {
    const { data } = await api.get(`/mortalidad/kpi/total`, { params });
    return data as { total: number };
  } catch {
    const { data } = await api.get(`/salud/mortalidad/kpi/total`, { params });
    return data as { total: number };
  }
}

export async function kpiAmbiente(params: { territorioId?: number|"all"; anio?: number; mes?: number|"all" }) {
  try {
    const { data } = await api.get(`/ambiente/kpi/total`, { params });
    return data as { total: number };
  } catch {
    const { data } = await api.get(`/salud/ambiente/kpi/total`, { params });
    return data as { total: number };
  }
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

// Alternative body shape per spec: { territorio_id, metricas: [...] }
export async function upsertAmbienteMetricasBundle(body: {
  territorio_id: number;
  metricas: { tipo_metrica: string; valor: number; unidad?: string; fecha_medicion?: string }[];
}) {
  const { data } = await api.post("/ambiente/metricas", body);
  return data;
}
