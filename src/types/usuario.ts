export type RolUsuario = "cliente" | "admin" | "vendedor";

export type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  fechaCreado: string;
  rol: RolUsuario;
  activo: boolean;
};

export type UsuarioAdmin = Usuario & {
  _count?: { ordenes: number; favoritos?: number };
};

export type UsuariosAdminRespuesta = {
  usuarios: UsuarioAdmin[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
};

export type RespuestaAuth = {
  usuario: Usuario;
  token: string;
};
