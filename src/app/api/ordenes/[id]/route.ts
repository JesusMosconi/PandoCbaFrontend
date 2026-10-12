import { obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await obtenerTokenSesion();
  if (!token) return Response.json({ message: "Iniciá sesión para ver tu orden" },
    { status: 401, headers: { "Cache-Control": "no-store" } });
  const { id } = await params;
  if (!/^\d+$/u.test(id)) return Response.json({ message: "ID de orden inválido" },
    { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const respuesta = await reenviarAExpress(`ordenes/${id}`, token);
    const headers = new Headers({ "Cache-Control": "no-store" });
    const tipo = respuesta.headers.get("content-type");
    if (tipo) headers.set("Content-Type", tipo);
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status, headers });
  } catch {
    return Response.json({ message: "No pudimos cargar la orden. Reintentá." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
