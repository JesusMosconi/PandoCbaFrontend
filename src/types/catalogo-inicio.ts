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

export interface SeleccionCatalogoInicio {
  id: number;
  orden: number;
  activo: boolean;
  productoId: number;
  producto: {
    id: number;
    nombre: string;
    activo: boolean;
    web: boolean;
    coleccionId: number | null;
  };
  motivosOcultamiento: ("inactivo" | "no_publicado")[];
}
