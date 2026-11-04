import type { CanalVenta } from "@/types/orden";

export type MedioPagoLocal ="efectivo" | "transferencia" | "debito" | "credito";

export interface VarianteLocal {
  id: number;
  talle: string;
  color: string;
  hex: string;
  stockDisponible: number;
}

export interface ProductoLocal {
  id: number;
  nombre: string;
  precio: string;
  web: boolean;
  imagen: string | null;
  categoria: string | null;
  /** Sin variantes vendibles: se muestra al final, sin opción de agregar. */
  sinStock: boolean;
  variantes: VarianteLocal[];
}

export interface CatalogoLocal {
  productos: ProductoLocal[];
  total: number;
  pagina: number;
  paginas: number;
}

export interface LineaVentaEnCurso {
  itemCarritoId: number;
  talleProductoId: number | null;
  /** Línea sin producto ni stock, con concepto e importe ingresados por el vendedor. */
  ventaRapida: boolean;
  nombreProducto: string;
  imagen: string | null;
  talle: string | null;
  color: string | null;
  cantidad: number;
  stockDisponible: number;
  precioVigente: string | null;
  importeLinea: string | null;
  cambioPrecio: boolean;
  disponible: boolean;
  motivosBloqueo: string[];
}

export interface ResumenVentaLocal {
  carritoId: number | null;
  lineas: LineaVentaEnCurso[];
  total: string;
  huellaResumen: string;
  /** deJornadaAnterior: la caja se abrió otro día y hay que cerrarla antes de vender. */
  caja: { id: number; abiertaEn: string; deJornadaAnterior: boolean } | null;
  puedeConfirmar: boolean;
}

export interface LineaComprobante {
  nombreProducto: string;
  ventaRapida: boolean;
  talle: string | null;
  color: string | null;
  cantidad: number;
  precioUnitario: string;
  importeLinea: string;
}

export interface VentaLocal {
  id: number;
  numeroComprobante: number;
  fecha: string;
  canal: "local";
  nombreCliente: string | null;
  telefonoCliente: string | null;
  metodoPago: MedioPagoLocal;
  total: string;
  cajaId: number;
  estado: string;
  lineas: LineaComprobante[];
}

// Administración: ventas por canal y medio de pago.

export interface ResumenMedioPago {
  metodoPago: string;
  total: string;
  cantidad: number;
}

export interface ResumenCanal {
  canal: CanalVenta;
  total: string;
  cantidad: number;
  medios: ResumenMedioPago[];
}

export interface ResumenVentasCanal {
  desde: string;
  hasta: string;
  total: string;
  cantidad: number;
  canales: ResumenCanal[];
}

export interface VentaAdmin {
  id: number;
  canal: CanalVenta;
  fechaPago: string;
  numeroComprobante: number | null;
  nombreCliente: string | null;
  telefonoCliente: string | null;
  metodoPago: string;
  total: string;
  estado: string;
  cajaId: number | null;
}

export interface PaginaVentasAdmin {
  ventas: VentaAdmin[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

export interface VentasLocalRespuesta {
  ventas: VentaLocal[];
  total: number;
  pagina: number;
  paginas: number;
}
