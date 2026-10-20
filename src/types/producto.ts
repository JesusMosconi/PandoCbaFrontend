import type { TalleProducto } from "@/types/talle-producto";

export interface VigenciaPrecio {
  clase: "regular" | "promocional";
  importe: string;
  inicio: string;
  fin: string | null;
  origen: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  activo: boolean;
  web: boolean;
  categoriaId: number;
  coleccionId: number | null;
  categoria: { id: number; nombre: string };
  coleccion: { id: number; nombre: string } | null;
  imagenes: { id: number; url: string; orden: number }[];
  talles: TalleProducto[];
}
