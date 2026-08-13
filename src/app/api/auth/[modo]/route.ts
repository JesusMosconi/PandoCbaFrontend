import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import type { RespuestaAuth } from "@/types/usuario";

const modosValidos = new Set(["login", "registro"]);
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest, { params }: { params: Promise<{ modo: string }> }) {
  const { modo } = await params;
  if (!modosValidos.has(modo)) {
    return NextResponse.json({ message: "Ruta de autenticaciÃ³n invÃ¡lida" }, { status: 404 });
  }
  if (!apiUrl) {
    return NextResponse.json({ message: "API no configurada" }, { status: 500 });
  }

  const respuesta = await fetch(`${apiUrl}/usuarios/${modo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
    cache: "no-store",
  });
  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) return NextResponse.json(cuerpo, { status: respuesta.status });

  const { token, usuario } = cuerpo as RespuestaAuth;
  const response = NextResponse.json({ usuario }, { status: respuesta.status });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
