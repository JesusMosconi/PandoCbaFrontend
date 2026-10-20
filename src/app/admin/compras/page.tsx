import Link from "next/link";
import AdminCompras from "@/components/AdminCompras";
import { exigirAdministrador } from "@/lib/autorizacion";

export default async function ComprasPage({ searchParams }: {
  searchParams: Promise<{ productoId?: string }>;
}) {
  await exigirAdministrador();
  const { productoId } = await searchParams;
  const productoIdInicial = productoId && /^[1-9]\d*$/.test(productoId) ? Number(productoId) : undefined;
  return <main className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin" className="text-sm font-semibold underline">Volver al panel</Link>
      <h1 className="mt-8 font-epilogue text-4xl font-black uppercase">Compras e ingresos</h1>
      <p className="mt-3 text-sm text-neutral-600">Registrá entregas completas, revisá importes y confirmá la recepción.</p>
      <div className="mt-8"><AdminCompras productoIdInicial={productoIdInicial} /></div>
    </div>
  </main>;
}
