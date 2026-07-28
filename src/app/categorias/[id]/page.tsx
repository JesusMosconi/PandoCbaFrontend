import CategoryFilters from "@/components/CategoryFilters";
import CategoryHeader from "@/components/CategoryHeader";
import ProductGrid from "@/components/ProductGrid";
import { ApiError, apiFetch } from "@/lib/api";
import { categoryDescriptions } from "@/lib/category-descriptions";
import type { Categoria } from "@/types/categoria";
import type { Producto } from "@/types/producto";
import { notFound } from "next/navigation";

type CategoryPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ talle?: string | string[]; orden?: string | string[] }>;
};

const firstValue = (value?: string | string[]) => typeof value === "string" ? value : undefined;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const talle = firstValue(query.talle);
  const orden = firstValue(query.orden);
  const productParams = new URLSearchParams({ categoriaId: id });
  if (talle) productParams.set("talle", talle);
  if (orden === "asc" || orden === "desc") productParams.set("orden", orden);

  let categoria: Categoria;
  let productos: Producto[];
  try {
    [categoria, productos] = await Promise.all([
      apiFetch<Categoria>(`/categorias/${id}`),
      apiFetch<Producto[]>(`/productos?${productParams.toString()}`),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return (
      <section className="p-6">
        <div className="border border-red-200 bg-red-50 p-6 text-red-800">No pudimos cargar esta categoría. Intentá de nuevo más tarde.</div>
      </section>
    );
  }

  return (
    <div>
      <CategoryHeader nombre={categoria.nombre} descripcion={categoryDescriptions[categoria.nombre]} />
      <CategoryFilters />
      <ProductGrid key={`${talle ?? ""}-${orden ?? ""}`} productos={productos} />
    </div>
  );
}
