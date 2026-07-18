"use client";
import { useState } from "react";
import { getProductosClient } from "@/lib/api";
import type { OrdenPrecio, Producto } from "@/lib/types";
import { LoadMoreButton } from "./LoadMoreButton";
import { ProductCard } from "./ProductCard";
type Props = { initialProducts: Producto[]; categoriaId: number; talle?: string; orden: OrdenPrecio; page: number; pageSize: number; hasMore: boolean };
export function ProductGrid({ initialProducts, categoriaId, talle, orden, page, pageSize, hasMore: initialHasMore }: Props) { const [products, setProducts] = useState(initialProducts), [currentPage, setCurrentPage] = useState(page), [hasMore, setHasMore] = useState(initialHasMore); async function loadMore() { const response = await getProductosClient({ categoriaId, talle, orden, page: currentPage + 1, pageSize }); setProducts((current) => [...current, ...response.data]); setCurrentPage(response.page); setHasMore(response.hasMore); } return <section className="px-5 py-8 md:px-8">{products.length ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map((producto) => <ProductCard key={producto.id} producto={producto}/>)}</div> : <p className="font-manrope text-[#5D5F5F]">No encontramos productos para estos filtros.</p>}<div className="mt-10 flex justify-center"><LoadMoreButton hasMore={hasMore} onLoadMore={loadMore}/></div></section>; }
