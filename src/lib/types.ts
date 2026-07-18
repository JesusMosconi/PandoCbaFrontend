export type Talle = { id: number; valor: string };
export type Color = { id: number; nombre: string; hex: string };
export type TalleProductoItem = { id: number; stock: number; talle: Talle; color: Color };
export type ImgProducto = { id: number; url: string; orden: number };
export type Categoria = { id: number; nombre: string };
export type Coleccion = { id: number; nombre: string };
export type Producto = {
  id: number; nombre: string; descripcion: string | null; precio: string | number;
  activo: boolean; web: boolean; categoriaId: number; categoria: Categoria;
  coleccion: Coleccion | null; imagenes: ImgProducto[]; talles: TalleProductoItem[];
};
export type ProductosResponse = { data: Producto[]; total: number; page: number; pageSize: number; hasMore: boolean };
export type OrdenPrecio = "recientes" | "precio_asc" | "precio_desc";
export type ProductosFiltros = { categoriaId: number; talle?: string; orden?: OrdenPrecio; page?: number; pageSize?: number };
