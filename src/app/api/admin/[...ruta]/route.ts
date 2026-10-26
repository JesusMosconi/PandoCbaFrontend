import { NextRequest } from "next/server";
import { obtenerSesion, obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

async function reenviar(request: NextRequest, { params }: { params: Promise<{ ruta: string[] }> }) {
  let usuario;
  try {
    usuario = await obtenerSesion();
  } catch {
    return Response.json({ message: "No pudimos verificar la sesión. Reintentá." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!usuario) return Response.json({ message: "No autorizado" },
    { status: 401, headers: { "Cache-Control": "no-store" } });
  if (usuario.rol !== "admin") return Response.json({ message: "Sin permisos" },
    { status: 403, headers: { "Cache-Control": "no-store" } });
  const token = await obtenerTokenSesion();
  if (!token) return Response.json({ message: "No autorizado" },
    { status: 401, headers: { "Cache-Control": "no-store" } });

  const { ruta } = await params;
  const prefijosAdministrativos = new Set(["ordenes", "proveedores", "compras", "inventario", "informes", "drops"]);
  const historialProducto = ruta[0] === "productos" && ruta.length === 3 && ruta[2] === "historial";
  const destino = prefijosAdministrativos.has(ruta[0]) || historialProducto ? ["admin", ...ruta] : ruta;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const respuesta = await reenviarAExpress(
      `${destino.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      token,
      {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      },
    );
    const respuestaHeaders = new Headers({ "Cache-Control": "no-store" });
    const respuestaContentType = respuesta.headers.get("content-type");
    if (respuestaContentType) respuestaHeaders.set("Content-Type", respuestaContentType);
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status, headers: respuestaHeaders });
  } catch {
    return Response.json({ message: "No pudimos contactar la API. Reintentá." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = reenviar;
export const POST = reenviar;
export const PUT = reenviar;
export const PATCH = reenviar;
export const DELETE = reenviar;
