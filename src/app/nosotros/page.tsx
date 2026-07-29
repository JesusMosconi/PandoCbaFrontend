import NewsletterForm from "@/components/NewsletterForm";
import { apiFetch } from "@/lib/api";
import type { ImagenNosotros } from "@/types/imagen-nosotros";

export const dynamic = "force-dynamic";

const processCards = [
  {
    heading: "MATERIA PRIMA",
    text: "Seleccionamos materiales de alta calidad, priorizando textura, resistencia y presencia. Cada elección define el carácter de la prenda desde su origen.",
  },
  {
    heading: "LA MAESTRÍA EN EL DETALLE",
    text: "Donde otros terminan, nosotros empezamos. Cada costura, corte y terminación está pensada para elevar lo esencial.",
  },
  {
    heading: "EDICIÓN LIMITADA",
    text: "Cada 'drop' consta de unidades numeradas. Cada pieza es parte de una colección exclusiva, creada para destacar y no repetirse.",
  },
];

export default async function NosotrosPage() {
  let imagenes: ImagenNosotros[] = [];

  try {
    imagenes = await apiFetch<ImagenNosotros[]>("/imagenes-nosotros");
  } catch {
    // La página mantiene sus fondos neutros si las imágenes todavía no están configuradas.
  }

  const imagenPrincipal = imagenes.find((imagen) => imagen.clave === "principal")?.imagenUrl;
  const imagenesProceso = processCards.map(
    (_, index) => imagenes.find((imagen) => imagen.clave === `proceso-${index + 1}`)?.imagenUrl
  );

  return (
    <div>
      <section
        className="relative flex min-h-[620px] items-center justify-center overflow-hidden bg-neutral-800 bg-cover bg-center px-6 text-center text-white md:h-[870px] md:min-h-0 md:px-16"
        style={imagenPrincipal ? { backgroundImage: `url(${imagenPrincipal})` } : undefined}
      >
        {imagenPrincipal && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative flex flex-col items-center gap-4">
          <h1 className="font-epilogue text-5xl font-bold uppercase leading-none tracking-[-0.04em] md:text-[80px] md:leading-[80px]">NOSOTROS</h1>
          <p className="font-manrope text-xs font-bold uppercase tracking-[0.4em] text-white/80">DESDE 2023 — PANDO CBA</p>
        </div>
      </section>

      <section className="grid gap-10 px-6 py-20 md:grid-cols-[minmax(0,466px)_1fr] md:gap-6 md:px-16 md:py-32">
        <h2 className="font-epilogue text-4xl font-semibold uppercase leading-none tracking-[-0.02em] text-[#1A1C1C] md:text-[48px] md:leading-[48px]">NUESTRA VISIÓN</h2>
        <div className="max-w-[662px]">
          <p className="text-lg leading-[29px] text-[#52525B]">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex</p>
          <p className="mt-8 text-lg leading-[29px] text-[#52525B]">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,</p>
          <blockquote className="mt-8 border-l-2 border-black py-4 pl-8">
            <p className="font-manrope text-xs font-bold uppercase tracking-[0.1em] text-black">PANDO</p>
            <p className="mt-2 font-epilogue text-2xl font-medium italic leading-tight tracking-[-0.025em] text-[#1A1C1C] md:text-[32px] md:leading-[38px]">“Lo esencial, llevado al límite.”</p>
          </blockquote>
        </div>
      </section>

      <section className="bg-[#F9F9F9] px-6 py-20 md:px-16 md:py-32">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <p className="font-manrope text-xs font-bold uppercase tracking-[0.1em] text-[#A1A1AA]">01 / PROCESO</p>
          <h3 className="font-epilogue text-2xl font-medium uppercase leading-tight tracking-[-0.05em] text-[#1A1C1C] md:text-[32px] md:leading-[38px]">LA MAESTRÍA EN EL DETALLE</h3>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {processCards.map((card, index) => (
            <article key={card.heading} className={index === 1 ? "md:mt-24" : undefined}>
              <div className="aspect-[362.67/483.53] overflow-hidden bg-[#E4E4E7]">
                {imagenesProceso[index] && (
                  <img
                    src={imagenesProceso[index]}
                    alt={card.heading}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              {/* TODO: confirmar si este heading debe ser distinto al de la sección */}
              <h4 className="pt-3 font-manrope text-xs font-bold uppercase tracking-[0.1em] text-[#1A1C1C]">{card.heading}</h4>
              <p className="mt-2 text-sm leading-5 text-[#71717A]">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#E4E4E7] px-6 py-20 text-center md:px-16 md:py-32 lg:px-64 lg:pb-36">
        <div className="mx-auto max-w-[768px]">
          <p className="font-manrope text-xs font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">NO TE QUEDES AFUERA</p>
          <h2 className="mt-4 font-epilogue text-5xl font-bold uppercase leading-none tracking-[-0.04em] text-[#1A1C1C] md:text-[80px] md:leading-[80px]">ACCESO EXCLUSIVO</h2>
          <p className="mt-6 text-base leading-6 text-[#9CA3AF]">Formá parte del lanzamiento antes que el resto.</p>
          <div className="mt-8 text-left"><NewsletterForm variant="light" /></div>
        </div>
      </section>
    </div>
  );
}
