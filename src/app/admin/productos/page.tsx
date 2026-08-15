import Link from "next/link";
import AdminProductos from "@/components/AdminProductos";
import { apiFetch } from "@/lib/api";
import { exigirAdministrador } from "@/lib/autorizacion";
import { obtenerTokenSesion } from "@/lib/session";
import type { Categoria } from "@/types/categoria";
import type { Coleccion } from "@/types/coleccion";
import type { Color } from "@/types/color";
import type { Producto } from "@/types/producto";
import type { Talle } from "@/types/talle";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  await exigirAdministrador();
  const token = await obtenerTokenSesion();

  let productos: Producto[] = [];
  let categorias: Categoria[] = [];
  let colecciones: Coleccion[] = [];
  let talles: Talle[] = [];
  let colores: Color[] = [];
  let errorCarga = false;

  try {
    [productos, categorias, colecciones, talles, colores] = await Promise.all([
      apiFetch<Producto[]>("/productos?admin=true", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      apiFetch<Categoria[]>("/categorias"),
      apiFetch<Coleccion[]>("/colecciones"),
      apiFetch<Talle[]>("/talles"),
      apiFetch<Color[]>("/colors"),
    ]);
  } catch {
    errorCarga = true;
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          <nav className="mb-8 flex gap-5 text-xs font-bold uppercase tracking-widest">
            <Link href="/admin/imagenes">{"Im\u00e1genes"}</Link>
            <Link className="underline underline-offset-4" href="/admin/productos">Productos</Link>
          </nav>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">Panel administrativo</p>
          <h1 className="mt-3 font-epilogue text-4xl font-black uppercase leading-none sm:text-6xl">
            Administrar productos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
            {"Cre\u00e1 y edit\u00e1 productos, variantes, talles y colores del cat\u00e1logo."}
          </p>
        </header>

        {errorCarga ? (
          <div className="border-2 border-red-700 bg-white p-6 text-red-700">
            {"No se pudieron cargar los registros. Comprob\u00e1 que el backend est\u00e9 funcionando y que"}
            {" "}
            NEXT_PUBLIC_API_URL sea correcto.
          </div>
        ) : (
          <AdminProductos
            productos={productos}
            categorias={categorias}
            colecciones={colecciones}
            talles={talles}
            colores={colores}
          />
        )}
      </div>
    </div>
  );
}
