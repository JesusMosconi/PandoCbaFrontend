import "server-only";

import { cookies } from "next/headers";
import type { Usuario } from "@/types/usuario";

export const SESSION_COOKIE = "pando_token";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

function obtenerApiUrl() {
  if (!apiUrl) throw new Error("Falta configurar API_URL o NEXT_PUBLIC_API_URL");
  return apiUrl;
}

export async function obtenerSesion(): Promise<Usuario | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const respuesta = await fetch(`${obtenerApiUrl()}/usuarios/perfil`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!respuesta.ok) return null;
  return respuesta.json() as Promise<Usuario>;
}

export async function obtenerTokenSesion() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}
