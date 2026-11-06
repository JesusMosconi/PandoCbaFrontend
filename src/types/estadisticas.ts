import type { VigenciaPrecio } from "@/types/producto";

export type CanalVenta = "web" | "local";
export type OrdenRanking = "unidades" | "importe";

export interface TotalesProducto {
  unidadesVendidas: number;
  unidadesDevueltas: number;
  unidadesNetas: number;
  importeVendido: string;
  importeDevuelto: string;
  importeNeto: string;
  /** Importe neto ÷ unidades netas; null sin unidades netas. */
  precioPromedio: string | null;
  cantidadOrdenes: number;
}

export interface FilaRanking extends TotalesProducto {
  posicion: number;
  productoId: number;
  nombre: string;
  categoria: string | null;
  imagen: string | null;
  activo: boolean;
  precioActual: string | null;
}

export interface FiltrosRanking {
  desde: string;
  hasta: string;
  canal?: CanalVenta;
  categoriaId?: number;
  orden: OrdenRanking;
  minUnidades?: number;
  minImporte?: string;
  pagina?: number;
  limite?: number;
}

export interface PaginaRanking {
  filtros: FiltrosRanking;
  totalResultados: number;
  pagina: number;
  limite: number;
  paginas: number;
  datos: FilaRanking[];
}

export interface Metrica<T> {
  actual: T;
  anterior: T;
  /** Porcentaje con un decimal; null si el período anterior fue cero. */
  variacion: number | null;
}

export interface ResumenInicio {
  desde: string;
  hasta: string;
  anterior: { desde: string; hasta: string };
  metricas: {
    total: Metrica<string>; cantidad: Metrica<number>; ticketPromedio: Metrica<string>;
    /** Unidades netas de productos del catálogo (sin venta rápida). */
    unidades: Metrica<number>;
  };
  devoluciones: { unidades: number; importe: string };
  canales: { canal: CanalVenta; total: string; cantidad: number; ticketPromedio: string }[];
  serieDiaria: { fecha: string; web: string; local: string; total: string }[];
  topProductos: FilaRanking[];
}

export interface EstadisticasProducto {
  producto: {
    id: number;
    nombre: string;
    categoria: string | null;
    imagen: string | null;
    activo: boolean;
    web: boolean;
    local: boolean;
    precioActual: string;
    stockFisicoActual: number;
  };
  /** Posición en el ranking por unidades del período; null sin ventas. */
  posicion: number | null;
  totales: TotalesProducto;
  canales: { canal: CanalVenta; unidadesNetas: number; importeNeto: string }[];
  variantes: { varianteId: number | null; talle: string; color: string; stock: number | null;
    unidadesNetas: number; importeNeto: string }[];
  serieDiaria: { fecha: string; unidadesNetas: number; importeNeto: string; precioPromedio: string | null }[];
  precios: VigenciaPrecio[];
}

export interface VarianteCritica {
  varianteId: number;
  productoId: number;
  producto: string;
  talle: string;
  color: string;
  /** Stock físico menos reservas vigentes. */
  disponible: number;
}

/** Tareas abiertas en este momento; no depende del período elegido. */
export interface PendientesInicio {
  generadoEn: string;
  ordenes: { pagoPorConfirmar: number; porPreparar: number; enPreparacion: number; esperandoRetiro: number; enCamino: number };
  reintegrosPendientes: number;
  incidenciasPago: number;
  comprasBorrador: number;
  caja: { abierta: false } | { abierta: true; abiertaEn: string; ventas: number; deJornadaAnterior: boolean };
  stock: { umbralBajo: number; agotadas: number; bajas: number; variantes: VarianteCritica[] };
}
