export type EstadoIngreso = "borrador" | "confirmado" | "anulado";

export interface LineaCompraEntrada {
  varianteId: number;
  cantidad: number;
  costoUnitario: string;
}

export interface GastoCompraEntrada {
  concepto: string;
  importe: string;
}

export interface BorradorCompraEntrada {
  proveedorId: number;
  fechaCompra: string;
  fechaRecepcion: string;
  lineas: LineaCompraEntrada[];
  gastosAdicionales?: GastoCompraEntrada[];
  observaciones?: string;
  comprobanteReferencia?: string;
}

export interface ErrorCompra {
  codigo: string;
  message: string;
  campos?: string[];
}

export interface CompraResumen {
  id: number;
  proveedorId: number;
  fechaCompra: string;
  fechaRecepcion: string;
  estado: EstadoIngreso;
  lineas: (LineaCompraEntrada & { id: number; activo: boolean })[];
  gastosCompra: (GastoCompraEntrada & { id: number; activo: boolean })[];
  importeMercaderia: string;
  gastosAdicionales: string;
  totalDesembolso: string;
  huellaResumen: string;
  partidas?: Array<{ id: number; varianteId: number; cantidadOriginal: number; costoUnitario: string | null }>;
  reiterada?: boolean;
  correcciones?: CorreccionIngreso[];
  devolucionesProveedor?: DevolucionProveedor[];
}

export interface PaginaCompras {
  datos: { id: number; proveedorId: number; fechaCompra: string; fechaRecepcion: string; estado: EstadoIngreso }[];
  total: number;
  pagina: number;
  limite: number;
}

export type CampoCorreccionIngreso = "cantidad" | "costoUnitario";
export type CampoEventoIngreso = CampoCorreccionIngreso | "estado";

export interface CorreccionIngresoEntrada {
  partidaId: number;
  campo: CampoCorreccionIngreso;
  valorNuevo: number | string;
  motivo: string;
  claveOperacion: string;
}

export interface CorreccionIngreso {
  id: number;
  ingresoId: number;
  partidaId: number;
  campo: CampoEventoIngreso;
  valorAnterior: number | string;
  valorNuevo: number | string;
  diferenciaCosto: string | null;
  motivo: string;
  actorUsuarioId: number;
  fecha: string;
  reiterada?: boolean;
}

export interface DevolucionProveedorEntrada {
  partidaId: number;
  cantidad: number;
  motivo: string;
  claveOperacion: string;
}

export interface DevolucionProveedor {
  id: number;
  ingresoId: number;
  partidaId: number;
  cantidad: number;
  importeRevertido: string;
  motivo: string;
  actorUsuarioId: number;
  fecha: string;
  reiterada?: boolean;
}
