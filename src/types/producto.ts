export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  activo: boolean;
  web: boolean;
  categoria: { id: number; nombre: string };
  coleccion: { id: number; nombre: string } | null;
  imagenes: { url: string; orden: number }[];
  talles: {
    id: number;
    stock: number;
    talle: { valor: string };
    color: { nombre: string; hex: string };
  }[];
}