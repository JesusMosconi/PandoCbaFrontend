import "server-only";

import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/session";
import type { Usuario } from "@/types/usuario";

/** Verifica la sesión y limita el panel a usuarios con rol administrativo. */
export async function exigirAdministrador(): Promise<Usuario> {
  const usuario = await obtenerSesion();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "admin") redirect("/");

  return usuario;
}

/** Punto de venta del local: admite al vendedor y al administrador. */
export async function exigirVendedor(): Promise<Usuario> {
  const usuario = await obtenerSesion();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "vendedor" && usuario.rol !== "admin") redirect("/");

  return usuario;
}
