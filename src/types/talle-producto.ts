export interface TalleProducto {
  id: number;
  stock: number;
  stockDisponible: number;
  estado: string;
  productoId: number;
  talleId: number;
  colorId: number;
  talle: { id: number; valor: string };
  color: { id: number; nombre: string; hex: string };
}
