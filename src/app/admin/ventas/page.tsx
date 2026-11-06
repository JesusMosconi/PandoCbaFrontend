import Link from "next/link";
import AdminVentas from "@/components/AdminVentas";
import { exigirAdministrador } from "@/lib/autorizacion";

export default async function AdminVentasPage() {
  await exigirAdministrador();
  return <main className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin" className="text-sm font-semibold underline">Volver al panel</Link>
      <h1 className="mt-8 font-epilogue text-4xl font-black uppercase">Ventas por canal</h1>
      <p className="mt-3 text-sm text-neutral-600">Web y local separados por medio de pago, con el historial de cajas.</p>
      <div className="mt-8"><AdminVentas /></div>
    </div>
  </main>;
}
