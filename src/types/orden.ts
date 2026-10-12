export type EstadoOrden =
  | "pendiente_pago"
  | "pago_confirmado"
  | "en_preparacion"
  | "lista_para_retiro"
  | "enviada"
  | "entregada"
  | "cancelada_cliente"
  | "cancelada_admin"
  | "cancelada_vencimiento";

export type EstadoVisibleOrden = EstadoOrden | "reserva_vencida_en_proceso";
export type EstadoCostoEnvio = "no_aplica" | "sin_cotizar";
export type TipoEntrega = "retiro" | "envio";

export interface DatosEnvioCheckout {
  direccion: string;
  ciudad: string;
  codPostal: string;
  telefono: string;
  email: string;
}

export interface EntradaEntrega {
  tipoEntrega: TipoEntrega;
  datosEnvio: DatosEnvioCheckout | null;
}

export interface LineaResumen {
  itemCarritoId: number;
  nombreProducto: string;
  talle: string | null;
  color: string | null;
  cantidad: number;
  precioCarrito: string;
  precioVigente: string | null;
  importeLinea: string | null;
  cambioPrecio: boolean;
  disponible: boolean;
  motivoBloqueo: string | null;
  motivosBloqueo?: string[];
}

export interface ResumenCheckout {
  lineas: LineaResumen[];
  subtotalCarrito: string;
  subtotalProductos: string;
  estadoCostoEnvio: EstadoCostoEnvio;
  costoEnvio: string | null;
  totalFinal: string | null;
  huellaResumen: string;
  puedeConfirmar: boolean;
}

export interface DetalleOrden {
  posicion: number;
  nombreProducto: string;
  talle: string;
  color: string;
  cantidad: number;
  precioUnitario: string;
  importeLinea: string;
}

export interface EventoOrden {
  fecha: string;
  origen: "cliente" | "administracion" | "tarea";
  actorUsuarioId: number | null;
  actorNombre?: string | null;
  estadoAnterior: EstadoOrden | null;
  estadoNuevo: EstadoOrden;
  motivo: string | null;
  restituirStock: boolean | null;
}

export interface Orden {
  id: number;
  usuarioId: number;
  tipoEntrega: TipoEntrega;
  estado: EstadoOrden | string;
  estadoVisible: EstadoVisibleOrden | string;
  puedeCancelar: boolean;
  esHeredada: boolean;
  creadaEn: string | null;
  venceEn: string | null;
  canceladaEn: string | null;
  subtotalProductos: string;
  estadoCostoEnvio: EstadoCostoEnvio | null;
  costoEnvio: string | null;
  totalFinal: string | null;
  pagoConfirmadoEn: string | null;
  envioCoordinado: boolean;
  envioCoordinadoEn: string | null;
  devolucion: "pendiente_de_gestionar" | null;
  detalles: DetalleOrden[];
  eventos?: EventoOrden[];
  datosEnvio?: DatosEnvioCheckout | null;
}

export interface OrdenAdmin extends Orden {
  cliente: { id: number; nombre: string; apellido: string; email: string };
  eventos: EventoOrden[];
  motivoCancelacion: string | null;
  restituirStock: boolean | null;
  pagoConfirmadoPorId: number | null;
  envioCoordinadoPorId: number | null;
}

export interface PaginaOrdenesAdmin {
  ordenes: OrdenAdmin[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

export interface ItemAfectado {
  itemCarritoId: number;
  motivo: string;
}

export interface CampoInvalido {
  campo: string;
  mensaje: string;
}

export interface ErrorOrden {
  message: string;
  codigo?: string;
  itemsAfectados?: ItemAfectado[];
  camposInvalidos?: CampoInvalido[];
  resumen?: ResumenCheckout;
  estadoActual?: EstadoOrden;
}
