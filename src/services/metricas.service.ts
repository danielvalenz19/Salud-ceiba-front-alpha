import api from "@/src/services/api";

export type MetricaRow = {
  ind_id: number | string;
  territorio_id: number;
  anio: number;
  mes: number;
  valor_num: number | null;
  valor_den?: number | null;
  updated_at?: string;
};

export type ListQuery = {
  territorio_id?: number;
  ind_id?: number | string;
  periodo_desde?: string; // 'YYYY-MM'
  periodo_hasta?: string; // 'YYYY-MM'
  page?: number;
  limit?: number;
};

export function getMetricas(params: ListQuery) {
  return api.get<{ data: MetricaRow[]; meta?: any }>("/metricas", { params }).then((r) => r.data);
}

export type MetricaUpsert = {
  ind_id: number | string;
  territorio_id: number;
  anio: number;
  mes: number;
  valor_num: number;
  valor_den?: number | null;
};

export function putMetricas(payload: MetricaUpsert[]) {
  return api.put("/metricas", payload).then((r) => r.data);
}
