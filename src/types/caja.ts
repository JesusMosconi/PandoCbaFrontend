export interface Caja {
  id: number;
  estado: "abierta" | "cerrada";
  abiertaEn: string;
  cerradaEn: string | null;
  efectivoInicial: string;
  cantidadVentas: number;
  totalesPorMedio: Record<string, string>;
  totalVentas: string;
  efectivoEsperado: string;
  efectivoDeclarado: string | null;
  diferencia: string | null;
  observacion: string | null;
  /** Solo en una caja abierta: se abrió un día anterior y bloquea las ventas. */
  deJornadaAnterior?: boolean;
}

export interface PaginaCajas {
  cajas: Caja[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

export interface RespuestaCajaActual {
  caja: Caja | null;
}

export interface RespuestaOperacionCaja {
  caja: Caja;
  reiterada: boolean;
  /** Ventas en curso sin confirmar que se descartaron con el cierre. */
  ventasEnCursoDescartadas?: number;
}
