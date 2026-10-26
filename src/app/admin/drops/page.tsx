import Link from "next/link";
import AdminDrops from "@/components/AdminDrops";
import { exigirAdministrador } from "@/lib/autorizacion";

export const dynamic = "force-dynamic";

export default async function AdminDropsPage() {
  await exigirAdministrador();
  return <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
    <nav className="mb-8 flex gap-5 text-xs font-bold uppercase tracking-widest"><Link href="/admin">Panel</Link><Link href="/admin/productos">Productos</Link></nav>
    <h1 className="font-epilogue text-4xl font-black uppercase">Drops</h1>
    <p className="mt-3 text-sm text-neutral-600">Creá y programá lanzamientos, consultá su estado y configurá la portada de marca.</p>
    <AdminDrops />
  </main>;
}
