import { notFound } from "next/navigation";
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { FilterSortBar } from "@/components/category/FilterSortBar";
import { ProductGrid } from "@/components/category/ProductGrid";
import { getProductos } from "@/lib/api";
import type { OrdenPrecio } from "@/lib/types";
const ordenes: OrdenPrecio[] = ["recientes", "precio_asc", "precio_desc"];
export default async function CategoryPage({ params, searchParams }: PageProps<"/categorias/[categoriaId]">) { const { categoriaId: rawId } = await params, query = await searchParams, categoriaId = Number(rawId); if (!Number.isInteger(categoriaId) || categoriaId < 1) notFound(); const talle = typeof query.talle === "string" ? query.talle : undefined, candidate = typeof query.orden === "string" ? query.orden : undefined, orden = ordenes.includes(candidate as OrdenPrecio) ? candidate as OrdenPrecio : "recientes", rawPage = typeof query.page === "string" ? Number(query.page) : 1, page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1, response = await getProductos({ categoriaId, talle, orden, page, pageSize: 6 }), nombre = response.data[0]?.categoria?.nombre ?? "Productos"; return <main className="min-h-screen bg-white text-[#1A1C1C]"><CategoryHeader title={nombre} description={`Explorá nuestra selección de ${nombre.toLowerCase()}.`}/><FilterSortBar/><ProductGrid initialProducts={response.data} categoriaId={categoriaId} talle={talle} orden={orden} page={response.page} pageSize={response.pageSize} hasMore={response.hasMore}/></main>; }
