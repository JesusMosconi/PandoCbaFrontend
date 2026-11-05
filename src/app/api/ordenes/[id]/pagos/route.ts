import { obtenerTokenSesion } from "@/lib/session";
import { reenviarAExpress } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await obtenerTokenSesion();
  if (!token) return Response.json({ message: "Iniciá sesión para pagar" }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ message: "ID inválido" }, { status: 400 });
  try {
    const respuesta = await reenviarAExpress(`ordenes/${id}/pagos`, token, { method: "POST", body: "{}" });
    return new Response(await respuesta.arrayBuffer(), { status: respuesta.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch { return Response.json({ message: "No pudimos iniciar el pago. Reintentá la misma orden." }, { status: 503 }); }
}
