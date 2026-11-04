import Link from "next/link";
import { notFound } from "next/navigation";
import BotonImprimir from "@/components/BotonImprimir";
import ComprobanteVenta from "@/components/ComprobanteVenta";
import { reenviarAExpress } from "@/lib/api";
import { obtenerTokenSesion } from "@/lib/session";
import type { VentaLocal } from "@/types/venta-local";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
};

export default async function ComprobantePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { nueva } = await searchParams;
  if (!/^\d+$/.test(id)) notFound();

  // El layout ya exigió vendedor o administrador; la API vuelve a validar el rol.
  const token = await obtenerTokenSesion();
  if (!token) notFound();
  const respuesta = await reenviarAExpress(`vendedor/ventas/${id}`, token);
  if (respuesta.status === 404) notFound();
  if (!respuesta.ok) throw new Error("No pudimos cargar el comprobante");
  const venta = await respuesta.json() as VentaLocal;

  return (
    <div className="space-y-6">
      {nueva === "1" && (
        <p role="status" className="border-2 border-green-700 bg-green-50 px-4 py-3 text-sm font-bold text-green-800 print:hidden">
          Venta registrada. Entregá la mercadería y el comprobante.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/vendedor/ventas" className="text-xs font-bold uppercase underline">Volver a ventas</Link>
        <div className="flex gap-3">
          <BotonImprimir />
          <Link href="/vendedor" className="border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-widest">Nueva venta</Link>
        </div>
      </div>
      <ComprobanteVenta venta={venta} />
    </div>
  );
}
