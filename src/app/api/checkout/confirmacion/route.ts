import { obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

export async function POST(request: Request) {
  const token = await obtenerTokenSesion();
  if (!token) {
    return Response.json({ message: "Iniciá sesión para confirmar tu compra", codigo: "SESION_REQUERIDA" },
      { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const respuesta = await reenviarAExpress("checkout/confirmacion", token, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" },
      body: await request.text(),
    });
    const headers = new Headers({ "Cache-Control": "no-store" });
    const contentType = respuesta.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status, headers });
  } catch {
    return Response.json({ message: "No pudimos confirmar ahora. Reintentá con la misma clave.", codigo: "SERVICIO_NO_DISPONIBLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
