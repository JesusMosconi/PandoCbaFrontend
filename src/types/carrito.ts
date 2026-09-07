import type { TalleProducto } from "@/types/talle-producto";

export interface ItemCarrito {
  id: number;
  cantidad: number;
  precioUnitario: string;
  talleProductoId: number | null;
  productoImprovisadoId: number | null;
  talleProducto: (TalleProducto & {
    producto: { id: number; nombre: string; imagenes: { id: number; url: string; orden: number }[] };
  }) | null;
  productoImprovisado: {
    id: number;
    nombre: string;
    talle: string | null;
    color: string | null;
    precio: string;
  } | null;
}

export interface Carrito {
  id: number;
  estado: string;
  canal: string;
  usuarioId: number;
  items: ItemCarrito[];
  subtotal: number;
}