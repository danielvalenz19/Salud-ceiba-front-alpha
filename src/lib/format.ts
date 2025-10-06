export const nf = new Intl.NumberFormat("es-GT");
export const pf = new Intl.NumberFormat("es-GT", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function mmYYYY(anio: number, mes: number) {
  return `${String(mes).padStart(2, "0")}/${anio}`;
}

export function periodoFmt(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

export function calculaValor(tipo: "porcentaje" | "porMil" | "crudo", num?: number | null, den?: number | null) {
  if (num == null) return "";
  if (tipo === "crudo" || !den) return nf.format(num);
  if (tipo === "porcentaje") return pf.format(num / den);
  if (tipo === "porMil") return `${((num / den) * 1000).toFixed(2)} ×1,000`;
  return nf.format(num);
}
