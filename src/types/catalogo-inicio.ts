export interface CatalogoInicioItem {
  id: number;
  orden: number;
  producto: {
    id: number;
    nombre: string;
    precio: string;
    descripcion: string | null;
    imagenes: { url: string; orden: number }[];
    talles: { talle: { valor: string } }[];
  };
}
