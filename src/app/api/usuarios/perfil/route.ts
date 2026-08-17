import { NextRequest, NextResponse } from "next/server";
import { obtenerTokenSesion } from "@/lib/session";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

async function reenviar(request: NextRequest) {
  const token = await obtenerTokenSesion();
  if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  if (!apiUrl) return NextResponse.json({ message: "API no configurada" }, { status: 500 });

  const respuesta = await fetch(`${apiUrl}/usuarios/perfil`, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: request.method === "GET" ? undefined : await request.text(),
    cache: "no-store",
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  return NextResponse.json(cuerpo, { status: respuesta.status });
}

export async function GET(request: NextRequest) {
  return reenviar(request);
}

export async function PUT(request: NextRequest) {
  return reenviar(request);
}
