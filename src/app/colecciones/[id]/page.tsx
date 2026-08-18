import CategoryHeader from "@/components/CategoryHeader";
import ProductGrid from "@/components/ProductGrid";
import { ApiError, apiFetch } from "@/lib/api";
import type { Coleccion } from "@/types/coleccion";
import type { Producto } from "@/types/producto";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ColeccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let coleccion: Coleccion;
  let productos: Producto[];

  try {
    [coleccion, productos] = await Promise.all([
      apiFetch<Coleccion>(`/colecciones/${id}`),
      apiFetch<Producto[]>(`/productos?coleccionId=${id}`),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <section className="p-6"><div className="border border-red-200 bg-red-50 p-6 text-red-800">No pudimos cargar esta colección. Intentá de nuevo más tarde.</div></section>;
  }

  return <><CategoryHeader nombre={coleccion.nombre} descripcion="Piezas seleccionadas de esta colección." /><ProductGrid productos={productos} /></>;
}
