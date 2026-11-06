import AdminInicio from "@/components/AdminInicio";
import AdminPendientes from "@/components/AdminPendientes";
import { exigirAdministrador } from "@/lib/autorizacion";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const usuario = await exigirAdministrador();
  const hoy = new Intl.DateTimeFormat("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="border-b border-black pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">{hoy}</p>
          <h1 className="mt-2 font-epilogue text-4xl font-black uppercase leading-none sm:text-5xl">
            Hola, {usuario.nombre}
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Primero, lo que necesita tu atención. Más abajo, cómo vienen las ventas.
          </p>
        </header>

        <AdminPendientes />
        <AdminInicio />
      </div>
    </div>
  );
}
