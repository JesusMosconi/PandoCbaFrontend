import Link from "next/link";
import DropCountdown from "@/components/DropCountdown";
import FeaturedProductCard from "@/components/FeaturedProductCard";
import NewsletterForm from "@/components/NewsletterForm";
import { apiFetch } from "@/lib/api";
import type { CatalogoInicioItem } from "@/types/catalogo-inicio";
import type { Coleccion } from "@/types/coleccion";
import type { ContenidoInicio } from "@/types/contenido-inicio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let colecciones: Coleccion[] = [];
  let contenidos: ContenidoInicio[] = [];
  let catalogo: CatalogoInicioItem[] = [];

  try {
    [colecciones, contenidos, catalogo] = await Promise.all([
      apiFetch<Coleccion[]>("/colecciones"),
      apiFetch<ContenidoInicio[]>("/contenido-inicio"),
      apiFetch<CatalogoInicioItem[]>("/catalogo-inicio"),
    ]);
  } catch {
    return <section className="p-6"><div className="border border-red-200 bg-red-50 p-6 text-red-800">No pudimos cargar el inicio. Intentá de nuevo más tarde.</div></section>;
  }

  const drop = colecciones.filter((collection) => collection.contadorActivo)
    .sort((a, b) => new Date(b.fechaCreado).getTime() - new Date(a.fechaCreado).getTime())[0];
  const hero = contenidos.find((content) => content.seccionNombre === "hero");
  const heroTitle = hero?.titulo ?? "NO SIGAS TENDENCIAS.\nCREALAS.";
  const heroButton = hero?.textBoton ?? "IR A LA COLECCIÓN";
  const backgroundStyle = drop?.imagenUrl ? { backgroundImage: `url(${drop.imagenUrl})` } : undefined;

  return (
    <div>
      <section className="flex min-h-[680px] bg-neutral-800 bg-cover bg-center px-6 py-10 md:h-[921px] md:min-h-0 md:px-16 md:py-16" style={backgroundStyle}>
        <div className="mt-auto flex flex-col items-start gap-4 text-white">
          {drop && <p className="bg-black px-4 py-2 font-manrope text-xs font-bold tracking-[0.3em]">{drop.numeroDrop === null ? "NEW DROP" : `NEW DROP // ${String(drop.numeroDrop).padStart(3, "0")}`}</p>}
          <h1 className="max-w-4xl whitespace-pre-line font-epilogue text-5xl font-bold uppercase leading-none tracking-[-0.04em] md:text-[80px] md:leading-[80px]">{heroTitle}</h1>
          <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:gap-8">
            {drop && <Link href={`/colecciones/${drop.id}`} className="border border-black bg-black px-8 py-5 font-manrope text-xs font-bold uppercase tracking-[0.1em] text-white sm:px-12">{heroButton}</Link>}
            {drop?.fechaLanzamiento && <DropCountdown fechaLanzamiento={drop.fechaLanzamiento} />}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-16 md:py-32">
        <div className="flex flex-col gap-6 border-b border-black pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-epilogue text-4xl font-semibold leading-none tracking-[-0.02em] text-[#1A1C1C] md:text-[48px] md:leading-[53px]">CATÁLOGO</h2>
            <p className="mt-2 font-manrope text-xs uppercase tracking-[0.1em] text-[#6B7280]">PIEZAS DE ARCHIVO & LANZAMIENTOS ESTACIONALES</p>
          </div>
          <div className="flex flex-wrap gap-4"><button type="button" className="border border-black px-4 py-3 font-manrope text-xs font-bold uppercase tracking-[0.1em]">TALLE ▾</button><button type="button" className="border border-black px-4 py-3 font-manrope text-xs font-bold uppercase tracking-[0.1em]">PRECIO ▾</button><Link href="/categorias" className="bg-black px-4 py-3 font-manrope text-xs font-bold uppercase tracking-[0.1em] text-white">VER TODO</Link></div>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalogo.slice(0, 5).map((item, index) => <div key={item.id} className={index === 0 ? "lg:col-span-2" : undefined}><FeaturedProductCard item={item} variant={index === 0 ? "large" : "small"} /></div>)}
        </div>
        {!catalogo.length && <p className="py-12 text-center text-[#6B7280]">Próximamente, nuevas piezas en el catálogo.</p>}
        <div className="mt-16 text-center"><Link href="/categorias" className="inline-block border-2 border-black px-8 py-5 font-manrope text-xs font-bold uppercase tracking-[0.4em] sm:px-16 sm:py-6">EXPLORAR TODO EL ARCHIVO</Link></div>
      </section>

      <section className="border-t-2 border-black bg-black px-6 py-20 text-center md:px-16 md:py-24 lg:px-48 lg:pb-28">
        <div className="mx-auto max-w-[896px]">
          <p className="font-manrope text-[10px] font-normal uppercase tracking-[0.4em] text-[#9CA3AF]">NO TE QUEDES AFUERA</p>
          <h2 className="mt-5 font-epilogue text-4xl font-semibold uppercase leading-tight tracking-[-0.02em] text-white md:text-[48px] md:leading-[53px]">PRÓXIMO DROP EN CAMINO</h2>
          <p className="mt-5 text-base leading-6 text-[#9CA3AF]">Formá parte del lanzamiento antes que el resto.</p>
          <div className="mt-8"><NewsletterForm variant="dark" /></div>
        </div>
      </section>
    </div>
  );
}
