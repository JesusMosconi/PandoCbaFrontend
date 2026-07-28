import Link from "next/link";
import type { CatalogoInicioItem } from "@/types/catalogo-inicio";

export default function FeaturedProductCard({ item, variant }: { item: CatalogoInicioItem; variant: "large" | "small" }) {
  const { producto } = item;
  const image = producto.imagenes[0];
  const sizes = [...new Set(producto.talles.map(({ talle }) => talle.valor))];
  const isLarge = variant === "large";

  return (
    <Link href={`/productos/${producto.id}`} className="group block">
      <div className={`relative overflow-hidden bg-[#EEEEEE] ${isLarge ? "aspect-[3/2]" : "aspect-[3/4]"}`}>
        {image && <img src={image.url} alt={producto.nombre} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />}
      </div>
      {producto.descripcion && <p className={`mt-3 font-manrope text-[10px] font-normal uppercase ${isLarge ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>{producto.descripcion}</p>}
      <div className={`mt-1 flex items-start justify-between gap-3 uppercase text-[#1A1C1C] ${isLarge ? "font-epilogue text-2xl font-medium tracking-[-0.01em] sm:text-[32px]" : "font-manrope text-lg font-bold"}`}>
        <h3>{producto.nombre}</h3>
        <span className="shrink-0">${producto.precio}</span>
      </div>
      {!!sizes.length && <div className="mt-3 flex flex-wrap gap-2">{sizes.map((size) => <span key={size} className="border border-[#E5E7EB] px-2 py-1 font-manrope text-[10px] font-bold text-[#1A1C1C]">{size}</span>)}</div>}
    </Link>
  );
}
