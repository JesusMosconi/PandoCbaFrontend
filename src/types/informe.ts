import type { VigenciaPrecio } from "@/types/producto";

export type EstadoConsultaInforme = "cargando" | "listo" | "vacio" | "error" | "denegado";

export interface FiltrosInforme {
  desde: string;
  hasta: string;
  productoId?: number;
  varianteId?: number;
  proveedorId?: number;
  pagina?: number;
  limite?: number;
}

export interface EventoInforme {
  id: string;
  tipo: "compra" | "gasto_compra" | "venta" | "devolucion_cliente" | "reintegro"
    | "correccion_ingreso" | "devolucion_proveedor" | "movimiento_inventario";
  fecha: string;
  productoId: number | null;
  varianteId: number | null;
  proveedorId: number | null;
  ingresoId?: number;
  ordenId?: number;
  devolucionId?: number;
  partidaId?: number | null;
  fechaCompra?: string;
  cantidad?: number;
  campo?: string;
  concepto?: string;
  movimientoTipo?: string;
  motivo?: string | null;
  compras?: string;
  gastosAdicionales?: string;
  importeVentaAtribuido?: string;
  costoVendidoConocido?: string;
  costoRevertido?: string;
  importeReintegrado?: string;
  importeReintegroPendiente?: string;
  diferenciaCorrecciones?: string;
  diferenciaCompras?: string;
  devolucionesProveedor?: string;
  unidadesCostoDesconocido?: number;
  costoDesconocido?: boolean;
}

export interface ResumenInforme {
  compras: string;
  gastosAdicionales: string;
  importeVentaAtribuido: string;
  costoVendidoConocido: string;
  costoRevertido: string;
  importeReintegrado: string;
  importeReintegroPendiente: string;
  diferenciaCorrecciones: string;
  diferenciaCompras: string;
  devolucionesProveedor: string;
  unidadesCostoDesconocido: number;
  margenBruto: string | null;
  advertenciaCobertura: string | null;
}

export interface InformeComprasVentas {
  filtros: FiltrosInforme;
  resumen: ResumenInforme;
  origenDesconocido: string;
  totalResultados: number;
  pagina: number;
  limite: number;
  paginas: number;
  datos: EventoInforme[];
}

export interface HistorialProducto extends InformeComprasVentas {
  producto: { id: number; nombre: string; stockFisicoActual: number };
  precios: VigenciaPrecio[];
  promocionEnPeriodo: boolean;
}
