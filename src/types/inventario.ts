export type ProveedorOrigen = { id: number; nombre: string } | null;

export type MovimientoInventarioAdmin = {
  id: number;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  fecha: string;
  actorUsuarioId: number | null;
  partida: { id: number; origen: string; proveedor: ProveedorOrigen } | null;
};

export type HistorialInventarioVariante = {
  varianteId: number;
  fisico: number;
  comprometido: number;
  libre: number;
  unidadesSinCosto: number;
  inventarioConciliado: boolean;
  partidas: Array<{
    id: number;
    origen: string;
    proveedor: ProveedorOrigen;
    fisico: number;
    costoUnitario: string | null;
  }>;
  movimientos: MovimientoInventarioAdmin[];
  total: number;
  pagina: number;
  limite: number;
};
