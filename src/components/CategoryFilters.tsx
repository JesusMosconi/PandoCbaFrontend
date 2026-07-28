"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const sizes = ["S", "M", "L", "XL"];

export default function CategoryFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSize = searchParams.get("talle") ?? "";
  const selectedOrder = searchParams.get("orden") ?? "";

  const updateFilter = (key: "talle" | "orden", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="flex flex-col gap-5 border-b border-black px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 font-epilogue text-xs font-bold uppercase tracking-[0.1em]">Filtrar por talle</span>
        {sizes.map((size) => {
          const selected = selectedSize === size;
          return (
            <button
              key={size}
              type="button"
              aria-pressed={selected}
              onClick={() => updateFilter("talle", selected ? "" : size)}
              className={`border border-black px-3 py-1 font-epilogue text-xs font-bold tracking-[0.1em] transition-colors ${
                selected ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>

      <label className="relative flex w-fit items-center">
        <span className="sr-only">Ordenar por precio</span>
        <select
          value={selectedOrder}
          onChange={(event) => updateFilter("orden", event.target.value)}
          className="appearance-none bg-transparent py-1 pr-6 font-epilogue text-xs font-bold uppercase tracking-[0.1em] outline-none"
        >
          <option value="">Precio: predeterminado</option>
          <option value="desc">Precio: de caro a barato</option>
          <option value="asc">Precio: de barato a caro</option>
        </select>
        <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-0" />
      </label>
    </section>
  );
}
