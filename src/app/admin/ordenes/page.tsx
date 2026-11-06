import Link from "next/link";
import AdminOrdenes from "@/components/AdminOrdenes";
import { exigirAdministrador } from "@/lib/autorizacion";

const ESTADOS = new Set([
  "pendiente_pago", "pago_confirmado", "en_preparacion", "lista_para_retiro", "enviada", "entregada",
  "cancelada_cliente", "cancelada_admin", "cancelada_vencimiento",
]);

export default async function AdminOrdenesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await exigirAdministrador();
  const { estado } = await searchParams;
  return <main className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin" className="text-sm font-semibold underline">Volver al panel</Link>
      <h1 className="mt-8 font-epilogue text-4xl font-black uppercase">Administrar órdenes</h1>
      <p className="mt-3 text-sm text-neutral-600">Pagos manuales, preparación, entrega y cancelaciones con historial.</p>
      <div className="mt-8"><AdminOrdenes estadoInicial={estado && ESTADOS.has(estado) ? estado : ""} /></div>
    </div>
  </main>;
}
