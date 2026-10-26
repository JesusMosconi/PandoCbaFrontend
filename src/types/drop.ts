import type { Coleccion } from "./coleccion";

export type InicioDrop =
  | { tipo: "activo"; drop: Pick<Coleccion, "id" | "nombre" | "numeroDrop" | "imagenUrl" | "tituloInicio" | "textoBotonInicio" | "fechaLanzamiento">; urlColeccion: string }
  | { tipo: "futuro"; drop: Pick<Coleccion, "id" | "nombre" | "numeroDrop" | "imagenUrl" | "tituloInicio" | "fechaLanzamiento"> }
  | { tipo: "marca"; marca: { imagenUrl: string } };

export interface DropAdmin extends Coleccion {
  estado: "borrador" | "futuro" | "pendiente" | "activo" | "finalizado" | "retirado";
  motivoEstado: string | null;
  productosDisponibles: number;
}

export interface MarcaInicio {
  titulo: string | null;
  imagenUrl: string | null;
  completo: boolean;
}

export interface DropsCategorias {
  destacado: null | { id: number; nombre: string; imagenUrl: string | null; urlColeccion: string; agotado: boolean };
  colecciones: Array<{ id: number; nombre: string; fechaLanzamiento: string; urlColeccion: string }>;
}
