"use client";

import { useState } from "react";
import type { Producto } from "@/types/producto";
import ProductCard from "@/components/ProductCard";

const INITIAL_VISIBLE_PRODUCTS = 6;

export default function ProductGrid({ productos }: { productos: Producto[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);

  if (!productos.length) {
    return <p className="px-6 py-16 text-center text-[#5D5F5F] md:px-12">No encontramos productos con estos filtros.</p>;
  }

  const visibleProducts = productos.slice(0, visibleCount);
  const hasMore = visibleCount < productos.length;

  return (
    <section className="px-6 py-8 md:px-12">
      <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((producto) => <ProductCard key={producto.id} producto={producto} />)}
      </div>
      {hasMore && (
        <div className="mt-6 border-t border-black pt-16 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_PRODUCTS)}
            className="border-2 border-black px-12 py-4 font-epilogue text-sm font-bold uppercase tracking-[0.1em] transition-colors hover:bg-black hover:text-white"
          >
            Ver más artículos
          </button>
        </div>
      )}
    </section>
  );
}
