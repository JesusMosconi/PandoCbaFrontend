import AdminImagenes from "@/components/AdminImagenes";
import { apiFetch } from "@/lib/api";
import type { Categoria } from "@/types/categoria";
import type { Coleccion } from "@/types/coleccion";
import type { ContenidoInicio } from "@/types/contenido-inicio";
import type { ImagenNosotros } from "@/types/imagen-nosotros";

export const dynamic = "force-dynamic";

export default async function AdminImagenesPage() {
  let categorias: Categoria[] = [];
  let colecciones: Coleccion[] = [];
  let contenidos: ContenidoInicio[] = [];
  let imagenesNosotros: ImagenNosotros[] = [];
  let errorCarga = false;

  try {
    [categorias, colecciones, contenidos, imagenesNosotros] = await Promise.all([
      apiFetch<Categoria[]>("/categorias"),
      apiFetch<Coleccion[]>("/colecciones"),
      apiFetch<ContenidoInicio[]>("/contenido-inicio"),
      apiFetch<ImagenNosotros[]>("/imagenes-nosotros"),
    ]);
  } catch {
    errorCarga = true;
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">Panel provisional</p>
          <h1 className="mt-3 font-epilogue text-4xl font-black uppercase leading-none sm:text-6xl">
            Administrar imágenes
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
            Subí, reemplazá o eliminá las imágenes visibles en categorías, colecciones y contenidos de Inicio.
          </p>
          <div className="mt-5 border border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
            Esta pantalla todavía no tiene autenticación. No debe publicarse sin proteger el acceso administrativo.
          </div>
        </header>

        {errorCarga ? (
          <div className="border-2 border-red-700 bg-white p-6 text-red-700">
            No se pudieron cargar los registros. Comprobá que el backend esté funcionando y que
            NEXT_PUBLIC_API_URL sea correcto.
          </div>
        ) : (
          <AdminImagenes
            categorias={categorias}
            colecciones={colecciones}
            contenidos={contenidos}
            imagenesNosotros={imagenesNosotros}
          />
        )}
      </div>
    </div>
  );
}
