import type { Metadata } from "next";
import Link from "next/link";
import ConfirmarBajaNewsletter from "@/components/ConfirmarBajaNewsletter";

export const metadata: Metadata = {
  title: "Baja del newsletter | PandoCBA",
  robots: { index: false, follow: false },
};

type BajaNewsletterPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function BajaNewsletterPage({ searchParams }: BajaNewsletterPageProps) {
  const { token } = await searchParams;

  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <p className="font-manrope text-[10px] font-bold uppercase tracking-[0.28em] text-[#6B7280]">Newsletter</p>
      <h1 className="mt-3 font-epilogue text-4xl font-bold uppercase tracking-[-0.04em] text-[#1A1C1C]">Darte de baja</h1>
      <div className="mt-8">
        {typeof token === "string" && token ? (
          <ConfirmarBajaNewsletter token={token} />
        ) : (
          <div>
            <p role="status" className="text-base leading-7 text-[#1A1C1C]">El enlace de baja no es válido.</p>
            <Link href="/" className="mt-8 inline-block border border-black px-8 py-4 font-manrope text-xs font-bold uppercase tracking-[0.2em] text-black">
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
