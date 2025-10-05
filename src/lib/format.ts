export const nf = new Intl.NumberFormat("es-GT");
export const pf = new Intl.NumberFormat("es-GT", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function mmYYYY(anio: number, mes: number) {
  return `${String(mes).padStart(2, "0")}/${anio}`;
}
