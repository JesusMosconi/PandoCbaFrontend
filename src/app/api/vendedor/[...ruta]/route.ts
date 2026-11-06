import { NextRequest } from "next/server";
import { obtenerSesion, obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

const sinCache = { "Cache-Control": "no-store" };

/** BFF del punto de venta: revalida la sesión y reenvía a /vendedor/... de Express con el token httpOnly. */
async function reenviar(request: NextRequest, { params }: { params: Promise<{ ruta: string[] }> }) {
  let usuario;
  try {
    usuario = await obtenerSesion();
  } catch {
    return Response.json({ message: "No pudimos verificar la sesión. Reintentá." }, { status: 503, headers: sinCache });
  }
  if (!usuario) return Response.json({ message: "No autorizado" }, { status: 401, headers: sinCache });
  if (usuario.rol !== "vendedor" && usuario.rol !== "admin") {
    return Response.json({ message: "Sin permisos" }, { status: 403, headers: sinCache });
  }
  const token = await obtenerTokenSesion();
  if (!token) return Response.json({ message: "No autorizado" }, { status: 401, headers: sinCache });

  const { ruta } = await params;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const respuesta = await reenviarAExpress(
      `vendedor/${ruta.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      token,
      {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      },
    );
    const respuestaHeaders = new Headers(sinCache);
    const respuestaContentType = respuesta.headers.get("content-type");
    if (respuestaContentType) respuestaHeaders.set("Content-Type", respuestaContentType);
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status, headers: respuestaHeaders });
  } catch {
    return Response.json({ message: "No pudimos contactar la API. Reintentá." }, { status: 503, headers: sinCache });
  }
}

export const GET = reenviar;
export const POST = reenviar;
export const PUT = reenviar;
export const DELETE = reenviar;
