import Link from "next/link";
import AdminCatalogoInicio from "@/components/AdminCatalogoInicio";
import { exigirAdministrador } from "@/lib/autorizacion";

export default async function AdminCatalogoInicioPage() {
  await exigirAdministrador();

  return (
    <main className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-semibold underline">Volver al panel</Link>
        <h1 className="mt-8 font-epilogue text-4xl font-black uppercase">Catálogo de Inicio</h1>
        <p className="mt-4 max-w-2xl text-sm text-neutral-600">
          Elegí hasta cinco productos de cualquier colección y definí el orden en que aparecen en Inicio.
          Los productos ocultos siguen seleccionados y ocupan un lugar.
        </p>
        <div className="mt-10"><AdminCatalogoInicio /></div>
      </div>
    </main>
  );
}
