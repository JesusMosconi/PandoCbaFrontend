import type { EstadoVisibleOrden } from "@/types/orden";

const titulos: Record<EstadoVisibleOrden, string> = {
  pendiente_pago: "Pendiente de pago",
  pago_confirmado: "Pago confirmado",
  en_preparacion: "En preparación",
  lista_para_retiro: "Lista para retirar",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada_cliente: "Cancelada por el cliente",
  cancelada_admin: "Cancelada por la tienda",
  cancelada_vencimiento: "Cancelada por vencimiento",
  reserva_vencida_en_proceso: "Reserva vencida; cancelación en proceso",
};

export function tituloEstadoOrden(estado: string): string {
  return titulos[estado as EstadoVisibleOrden] ?? estado.replaceAll("_", " ");
}
