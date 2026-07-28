export interface Coleccion {
  id: number;
  nombre: string;
  imagenUrl: string | null;
  fechaLanzamiento: string | null;
  numeroDrop: number | null;
  contadorActivo: boolean;
  fechaCreado: string;
}
