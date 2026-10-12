import { obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

export async function GET() {
  const token = await obtenerTokenSesion();
  if (!token) return Response.json({ message: "Iniciá sesión para ver tus órdenes" },
    { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const respuesta = await reenviarAExpress("ordenes", token);
    const headers = new Headers({ "Cache-Control": "no-store" });
    const tipo = respuesta.headers.get("content-type");
    if (tipo) headers.set("Content-Type", tipo);
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status, headers });
  } catch {
    return Response.json({ message: "No pudimos cargar tus órdenes. Reintentá." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
