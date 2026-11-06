import Link from "next/link";
import { notFound } from "next/navigation";
import AdminTrazabilidadProducto from "@/components/AdminTrazabilidadProducto";
import { exigirAdministrador } from "@/lib/autorizacion";
import { rangoPeriodo } from "@/lib/estadisticas";

export const dynamic = "force-dynamic";

const fechaValida = (valor?: string) => Boolean(valor && /^\d{4}-\d{2}-\d{2}$/.test(valor));

export default async function TrazabilidadProductoPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await exigirAdministrador();
  const [{ id }, { desde, hasta }] = await Promise.all([params, searchParams]);
  if (!/^[1-9]\d*$/.test(id)) notFound();
  const periodo = rangoPeriodo("30d");

  return <main className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/admin/productos" className="underline">Volver a productos</Link>
        <Link href="/admin/ranking" className="underline">Ver ranking</Link>
      </div>
      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Trazabilidad del producto</p>
      <div className="mt-3">
        <AdminTrazabilidadProducto productoId={Number(id)}
          desdeInicial={fechaValida(desde) ? desde! : periodo.desde}
          hastaInicial={fechaValida(hasta) ? hasta! : periodo.hasta} />
      </div>
    </div>
  </main>;
}
