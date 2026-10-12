import { obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

export async function POST(request: Request) {
  const token = await obtenerTokenSesion();
  if (!token) {
    return Response.json({ message: "Iniciá sesión para revisar tu compra", codigo: "SESION_REQUERIDA" },
      { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const respuesta = await reenviarAExpress("checkout/resumen", token, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" },
      body: await request.text(),
    });
    const headers = new Headers({ "Cache-Control": "no-store" });
    const contentType = respuesta.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status, headers });
  } catch {
    return Response.json({ message: "No pudimos consultar el resumen. Reintentá.", codigo: "SERVICIO_NO_DISPONIBLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
