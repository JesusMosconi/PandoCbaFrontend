import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/autorizacion";
import { obtenerTokenSesion } from "@/lib/session";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

async function reenviar(request: NextRequest, { params }: { params: Promise<{ ruta: string[] }> }) {
  await exigirAdministrador();

  const token = await obtenerTokenSesion();
  if (!token) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  if (!apiUrl) return NextResponse.json({ message: "API no configurada" }, { status: 500 });

  const { ruta } = await params;
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const respuesta = await fetch(`${apiUrl}/${ruta.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });

  const respuestaHeaders = new Headers();
  const respuestaContentType = respuesta.headers.get("content-type");
  if (respuestaContentType) respuestaHeaders.set("Content-Type", respuestaContentType);

  return new NextResponse(await respuesta.arrayBuffer(), {
    status: respuesta.status,
    headers: respuestaHeaders,
  });
}

export const GET = reenviar;
export const POST = reenviar;
export const PUT = reenviar;
export const DELETE = reenviar;
