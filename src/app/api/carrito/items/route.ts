import { NextRequest, NextResponse } from "next/server";
import { obtenerTokenSesion } from "@/lib/session";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  const token = await obtenerTokenSesion();
  if (!token) return NextResponse.json({ message: "Tenés que ingresar para usar el carrito" }, { status: 401 });
  if (!apiUrl) return NextResponse.json({ message: "API no configurada" }, { status: 500 });

  const respuesta = await fetch(`${apiUrl}/carrito/items`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: await request.text(),
    cache: "no-store",
  });
  return new NextResponse(await respuesta.arrayBuffer(), {
    status: respuesta.status,
    headers: { "Content-Type": respuesta.headers.get("content-type") ?? "application/json" },
  });
}