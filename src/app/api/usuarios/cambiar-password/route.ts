import { NextRequest, NextResponse } from "next/server";
import { obtenerTokenSesion } from "@/lib/session";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function PUT(request: NextRequest) {
  const token = await obtenerTokenSesion();
  if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  if (!apiUrl) return NextResponse.json({ message: "API no configurada" }, { status: 500 });

  const respuesta = await fetch(`${apiUrl}/usuarios/cambiar-password`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: await request.text(),
    cache: "no-store",
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  return NextResponse.json(cuerpo, { status: respuesta.status });
}
