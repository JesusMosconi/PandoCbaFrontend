import type { MedioPagoLocal } from "@/types/venta-local";

export const MEDIOS_PAGO_LOCAL: { valor: MedioPagoLocal; etiqueta: string }[] = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "transferencia", etiqueta: "Transferencia" },
  { valor: "debito", etiqueta: "Débito" },
  { valor: "credito", etiqueta: "Crédito" },
];

export function etiquetaMedioPago(valor: string): string {
  return MEDIOS_PAGO_LOCAL.find((medio) => medio.valor === valor)?.etiqueta ?? (valor === "manual" ? "Manual (web)" : valor);
}

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function formatearDinero(importe: string | number | null | undefined): string {
  if (importe === null || importe === undefined || importe === "") return "-";
  return moneda.format(Number(importe));
}

export function formatearFechaHora(fecha: string | null | undefined): string {
  if (!fecha) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(fecha));
}

const textosMotivo: Record<string, string> = {
  cantidad_invalida: "Cantidad inválida",
  producto_improvisado: "Producto no admitido",
  variante_inactiva: "Variante inactiva",
  producto_retirado: "Producto retirado",
  producto_no_local: "No se vende en el local",
  drop_no_lanzado: "Drop sin lanzar",
  stock_insuficiente: "Stock insuficiente",
};

export function textoMotivo(motivo: string): string {
  return textosMotivo[motivo] ?? motivo;
}

/** Día actual en Buenos Aires, en formato AAAA-MM-DD. */
export function hoyBuenosAires(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}
