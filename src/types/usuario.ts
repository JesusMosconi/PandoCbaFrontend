export type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  fechaCreado: string;
  rol: "cliente" | "admin";
};

export type RespuestaAuth = {
  usuario: Usuario;
  token: string;
};
