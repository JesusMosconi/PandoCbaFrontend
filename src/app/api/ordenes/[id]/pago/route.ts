import { obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await obtenerTokenSesion();
  if (!token) return Response.json({ message: "Iniciá sesión para consultar el pago" }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ message: "ID inválido" }, { status: 400 });
  try {
    const respuesta = await reenviarAExpress(`ordenes/${id}/pago`, token);
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch { return Response.json({ message: "No pudimos verificar el pago. Volvé a consultar." }, { status: 503 }); }
}
