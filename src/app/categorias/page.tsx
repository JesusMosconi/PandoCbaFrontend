import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";
import { categoryTags, dropTag } from "@/lib/category-tags";
import { apiFetch } from "@/lib/api";
import type { Categoria } from "@/types/categoria";
import type { Coleccion } from "@/types/coleccion";

const categoryTiles = [
  { name: "Buzos", area: "buzos" },
  { name: "Remeras", area: "remeras" },
  { name: "Pantalones", area: "pantalones" },
  { name: "Zapatillas", area: "zapatillas" },
] as const;

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
}

function Tile({ href, title, tag, imageUrl, area }: { href?: string; title: string; tag: string; imageUrl?: string | null; area: string }) {
  const content = (
    <>
      {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative mt-auto w-fit max-w-[calc(100%-2rem)] border-2 border-black bg-white p-5 sm:p-8">
        <h2 className="font-epilogue text-3xl font-bold uppercase leading-none tracking-[-0.02em] text-[#1A1C1C] sm:text-[40px] sm:leading-[44px]">{title}</h2>
        <p className="mt-2 font-epilogue text-xs font-bold uppercase tracking-[0.1em] text-black">{tag}</p>
      </div>
    </>
  );
  const className = `relative flex min-h-[320px] overflow-hidden bg-[#6B6767] ${area}`;
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

export default async function CategoriasPage() {
  let categorias: Categoria[] = [];
  let colecciones: Coleccion[] = [];
  let loadError = false;

  try {
    [categorias, colecciones] = await Promise.all([
      apiFetch<Categoria[]>("/categorias"),
      apiFetch<Coleccion[]>("/colecciones"),
    ]);
  } catch {
    loadError = true;
  }

  const byNewest = (a: Coleccion, b: Coleccion) => new Date(b.fechaCreado).getTime() - new Date(a.fechaCreado).getTime();
  const drop = colecciones.filter((collection) => collection.contadorActivo).sort(byNewest)[0];
  const ultimasColecciones = [...colecciones].sort(byNewest).slice(0, 3);

  return (
    <div>
      <header className="flex flex-col gap-8 border-b-2 border-black px-6 py-10 md:flex-row md:items-end md:justify-between md:px-8 md:pb-8 md:pt-16">
        <div>
          <p className="font-epilogue text-xs font-bold uppercase tracking-[0.1em]">ÚLTIMA SELECCIÓN / 2026</p>
          <h1 className="mt-3 font-epilogue text-5xl font-black uppercase leading-none tracking-[-0.04em] text-[#1A1C1C] md:text-[80px] md:leading-[80px]">CATEGORÍAS</h1>
        </div>
        <p className="max-w-md text-base leading-6 text-[#4C4546]">Explorá las piezas que definen la selección actual de Pando CBA.</p>
      </header>

      {loadError ? <p className="px-6 py-16 text-center text-[#4C4546]">No pudimos cargar las categorías. Intentá de nuevo más tarde.</p> : (
        <>
          <section className="category-collage border-b-2 border-black" aria-label="Categorías destacadas">
            {categoryTiles.map(({ name, area }) => {
              const categoria = categorias.find((item) => normalized(item.nombre) === normalized(name));
              return <Tile key={name} area={area} title={name} tag={categoryTags[name]} imageUrl={categoria?.imagenUrl} href={categoria ? `/categorias/${categoria.id}` : undefined} />;
            })}
            {drop && <Tile area="drop" title={drop.nombre} tag={dropTag} imageUrl={drop.imagenUrl} href={`/colecciones/${drop.id}`} />}
          </section>

          <section className="grid border-b-2 border-black md:grid-cols-2">
            <div className="border-b-2 border-black p-8 md:border-r-2 md:border-b-0 md:p-16">
              <p className="font-epilogue text-xs font-bold uppercase tracking-[0.1em]">NO TE QUEDES AFUERA</p>
              <h2 className="mt-8 max-w-md font-epilogue text-3xl font-bold uppercase leading-tight tracking-[-0.02em] text-[#1A1C1C] md:text-[40px] md:leading-[44px]">PRÓXIMO DROP EN CAMINO</h2>
              <div className="mt-8"><NewsletterForm /></div>
            </div>
            <div className="p-8 md:p-16">
              <p className="mb-8 font-epilogue text-xs font-bold uppercase tracking-[0.1em]">COLECCIONES</p>
              <ul className="space-y-4">
                {ultimasColecciones.map((coleccion) => <li key={coleccion.id} className="flex items-center justify-between gap-4 border-b border-[#E2E2E2] pb-2"><span className="font-epilogue text-xl font-bold uppercase tracking-[-0.01em] md:text-2xl">{coleccion.nombre}</span><Link href={`/colecciones/${coleccion.id}`} className="shrink-0 font-epilogue text-xs font-bold uppercase tracking-[0.1em]">VER →</Link></li>)}
                {!ultimasColecciones.length && <li className="text-sm text-[#4C4546]">Próximamente nuevas colecciones.</li>}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
