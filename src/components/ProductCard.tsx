import Link from "next/link";
import type { Producto } from "@/types/producto";

type ProductCardProps = {
  producto: Producto;
};

export default function ProductCard({ producto }: ProductCardProps) {
  const availableSizes = [...new Set(producto.talles.filter(({ stock }) => stock > 0).map(({ talle }) => talle.valor))];
  const image = producto.imagenes[0];

  return (
    <Link href={`/productos/${producto.id}`} className="group block pb-8">
      <div className="relative aspect-[3/4] overflow-hidden border border-black bg-[#EEEEEE]">
        {image ? (
          <>
            <img src={image.url} alt={producto.nombre} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="pointer-events-none absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold uppercase tracking-wider text-[#5D5F5F]">
            Sin imagen disponible
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 font-epilogue text-xl font-bold leading-tight tracking-[-0.01em] text-[#1A1C1C] md:text-2xl">
        <h2 className="uppercase">{producto.nombre}</h2>
        <span className="shrink-0">${producto.precio}</span>
      </div>
      <p className="mt-2 font-epilogue text-xs font-bold uppercase tracking-[0.1em] text-[#5D5F5F]">
        Disponibles: {availableSizes.length ? availableSizes.join(", ") : "Sin stock"}
      </p>
    </Link>
  );
}
