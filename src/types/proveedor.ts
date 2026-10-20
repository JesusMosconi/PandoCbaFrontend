export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  observaciones: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface EventoProveedor {
  id: number;
  proveedorId: number;
  tipo: "creacion" | "edicion" | "desactivacion" | "reactivacion";
  motivo: string;
  valoresAnteriores?: { nombre: string; contacto: string | null; observaciones: string | null } | null;
  valoresNuevos?: { nombre: string; contacto: string | null; observaciones: string | null } | null;
  actorUsuarioId: number;
  fecha: string;
}

export interface ProveedorDetalle extends Proveedor {
  eventos: EventoProveedor[];
  ingresos: {
    datos: { id: number; fechaCompra: string; fechaRecepcion: string; estado: string; confirmadoEn: string | null }[];
    total: number;
    pagina: number;
    limite: number;
  };
}

export interface PaginaProveedores {
  datos: (Proveedor & { _count: { ingresos: number } })[];
  total: number;
  pagina: number;
  limite: number;
}
