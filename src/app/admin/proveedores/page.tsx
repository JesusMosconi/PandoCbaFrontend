import Link from "next/link";
import AdminProveedores from "@/components/AdminProveedores";
import { exigirAdministrador } from "@/lib/autorizacion";

export default async function ProveedoresPage() {
  await exigirAdministrador();
  return <main className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin" className="text-sm font-semibold underline">Volver al panel</Link>
      <h1 className="mt-8 font-epilogue text-4xl font-black uppercase">Proveedores</h1>
      <p className="mt-3 text-sm text-neutral-600">Consultá y gestioná proveedores sin perder su historial.</p>
      <div className="mt-8"><AdminProveedores /></div>
    </div>
  </main>;
}
