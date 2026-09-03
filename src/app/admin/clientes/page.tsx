import Link from "next/link";
import AdminClientes from "@/components/AdminClientes";
import { apiFetch } from "@/lib/api";
import { exigirAdministrador } from "@/lib/autorizacion";
import { obtenerTokenSesion } from "@/lib/session";
import { normalizarRespuestaUsuarios } from "@/lib/usuarios";
import type { UsuariosAdminRespuesta } from "@/types/usuario";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  await exigirAdministrador();
  const token = await obtenerTokenSesion();
  let respuesta: UsuariosAdminRespuesta = { usuarios: [], total: 0, pagina: 1, limite: 20, paginas: 0 };
  let errorCarga = false;

  try {
    const datos = await apiFetch<unknown>("/admin/usuarios?pagina=1&limite=20", {
      headers: { Authorization: `Bearer ${token}` },
    });
    respuesta = normalizarRespuestaUsuarios(datos);
  } catch {
    errorCarga = true;
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <nav className="mb-8 flex flex-wrap gap-5 text-xs font-bold uppercase tracking-widest">
            <Link href="/admin/imagenes">Imagenes</Link>
            <Link href="/admin/productos">Productos</Link>
            <Link className="underline underline-offset-4" href="/admin/clientes">Clientes</Link>
          </nav>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">Panel administrativo</p>
          <h1 className="mt-3 font-epilogue text-4xl font-black uppercase leading-none sm:text-6xl">Clientes</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">Consultá y administrá las cuentas registradas en el ecommerce.</p>
        </header>
        {errorCarga ? (
          <div className="border-2 border-red-700 bg-white p-6 text-red-700">No se pudieron cargar los clientes. Comprobá que el backend esté funcionando.</div>
        ) : (
          <AdminClientes respuestaInicial={respuesta} />
        )}
      </div>
    </div>
  );
}
