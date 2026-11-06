import { hoyBuenosAires } from "@/lib/venta-local";
import type { CanalVenta } from "@/types/estadisticas";
import type { VigenciaPrecio } from "@/types/producto";

/** Paleta validada (CVD y contraste) para dos series sobre fondo claro. */
export const COLOR_SERIE: Record<CanalVenta, string> = { web: "#2a78d6", local: "#eb6834" };
export const COLOR_PRINCIPAL = COLOR_SERIE.web;
export const COLOR_SECUNDARIO = COLOR_SERIE.local;

export const nombreCanal = (canal: string) => (canal === "local" ? "Local" : "Web");

/** Suma días a una fecha AAAA-MM-DD sin depender de la zona horaria del navegador. */
export function sumarDias(fecha: string, dias: number): string {
  const valor = new Date(`${fecha}T00:00:00.000Z`);
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}

export type PeriodoRapido = "hoy" | "7d" | "30d" | "mes";

export const PERIODOS_RAPIDOS: { valor: PeriodoRapido; etiqueta: string }[] = [
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "7d", etiqueta: "7 días" },
  { valor: "30d", etiqueta: "30 días" },
  { valor: "mes", etiqueta: "Mes actual" },
];

export function rangoPeriodo(periodo: PeriodoRapido, hoy = hoyBuenosAires()): { desde: string; hasta: string } {
  if (periodo === "hoy") return { desde: hoy, hasta: hoy };
  if (periodo === "7d") return { desde: sumarDias(hoy, -6), hasta: hoy };
  if (periodo === "mes") return { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy };
  return { desde: sumarDias(hoy, -29), hasta: hoy };
}

/** «12/10» para ejes; «12/10/2026» para tooltips y textos. */
export const fechaCorta = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
export const fechaLarga = (fecha: string) => fecha.split("-").reverse().join("/");

const compacto = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });
export const dineroCompacto = (valor: number) => `$${compacto.format(valor)}`;

/** Precio regular vigente al cierre de cada día de Buenos Aires (fin del día a las 24 h, UTC−3). */
export function precioPublicadoDelDia(precios: VigenciaPrecio[], fecha: string): number | null {
  const cierre = new Date(`${sumarDias(fecha, 1)}T00:00:00-03:00`).getTime() - 1;
  const vigente = precios.filter((precio) => precio.clase === "regular").find((precio) =>
    new Date(precio.inicio).getTime() <= cierre && (precio.fin === null || new Date(precio.fin).getTime() > cierre));
  return vigente ? Number(vigente.importe) : null;
}

export function parametros(valores: object) {
  const resultado = new URLSearchParams();
  for (const [clave, valor] of Object.entries(valores) as [string, unknown][]) {
    if (valor !== undefined && valor !== "") resultado.set(clave, String(valor));
  }
  return resultado;
}
