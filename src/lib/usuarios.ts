import type { UsuarioAdmin, UsuariosAdminRespuesta } from "@/types/usuario";

export function normalizarRespuestaUsuarios(
  datos: unknown,
  pagina = 1,
  limite = 20
): UsuariosAdminRespuesta {
  if (Array.isArray(datos)) {
    const usuarios = datos as UsuarioAdmin[];
    return {
      usuarios,
      total: usuarios.length,
      pagina,
      limite,
      paginas: Math.max(Math.ceil(usuarios.length / limite), 1),
    };
  }

  if (datos && typeof datos === "object" && Array.isArray((datos as UsuariosAdminRespuesta).usuarios)) {
    return datos as UsuariosAdminRespuesta;
  }

  throw new Error("El backend devolvió una respuesta de usuarios inválida");
}
