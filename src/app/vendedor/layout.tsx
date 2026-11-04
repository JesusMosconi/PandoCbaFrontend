import NavegacionVendedor from "@/components/NavegacionVendedor";
import { exigirVendedor } from "@/lib/autorizacion";

export const dynamic = "force-dynamic";

export default async function VendedorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const usuario = await exigirVendedor();
  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-4 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">Local</p>
          <h1 className="font-epilogue text-3xl font-black uppercase">Punto de venta</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <NavegacionVendedor />
          <p className="text-xs text-neutral-500">{usuario.nombre} {usuario.apellido} · {usuario.rol === "admin" ? "Administrador" : "Vendedor"}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
