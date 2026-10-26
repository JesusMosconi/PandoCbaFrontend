export interface Coleccion {
  id: number;
  nombre: string;
  imagenUrl: string | null;
  fechaLanzamiento: string | null;
  numeroDrop: number | null;
  contadorActivo: boolean;
  fechaCreado: string;
  fechaFinalizacion: string | null;
  tituloInicio: string | null;
  textoBotonInicio: string | null;
  fechaActivacion: string | null;
  fechaCierre: string | null;
  motivoCierre: string | null;
  activo: boolean;
}
