export interface ImagenNosotros {
  id: number;
  clave: "principal" | "proceso-1" | "proceso-2" | "proceso-3";
  nombre: string;
  orden: number;
  imagenUrl: string | null;
}
