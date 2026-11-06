import Link from "next/link";
import AdminRanking, { type FiltrosRankingIniciales } from "@/components/AdminRanking";
import { apiFetch } from "@/lib/api";
import { exigirAdministrador } from "@/lib/autorizacion";
import { rangoPeriodo } from "@/lib/estadisticas";
import type { Categoria } from "@/types/categoria";

export const dynamic = "force-dynamic";

type Parametros = Partial<Record<keyof FiltrosRankingIniciales, string>>;
const fechaValida = (valor?: string) => Boolean(valor && /^\d{4}-\d{2}-\d{2}$/.test(valor));

export default async function AdminRankingPage({ searchParams }: { searchParams: Promise<Parametros> }) {
  await exigirAdministrador();
  const consulta = await searchParams;
  const periodo = rangoPeriodo("30d");
  const iniciales: FiltrosRankingIniciales = {
    desde: fechaValida(consulta.desde) ? consulta.desde! : periodo.desde,
    hasta: fechaValida(consulta.hasta) ? consulta.hasta! : periodo.hasta,
    canal: consulta.canal === "web" || consulta.canal === "local" ? consulta.canal : "",
    categoriaId: consulta.categoriaId && /^[1-9]\d*$/.test(consulta.categoriaId) ? consulta.categoriaId : "",
    orden: consulta.orden === "importe" ? "importe" : "unidades",
    minUnidades: consulta.minUnidades && /^\d+$/.test(consulta.minUnidades) ? consulta.minUnidades : "",
    minImporte: consulta.minImporte ?? "",
  };
  let categorias: Categoria[] = [];
  try {
    categorias = await apiFetch<Categoria[]>("/categorias");
  } catch {
    // Sin categorías el ranking sigue funcionando, solo sin ese filtro.
  }

  return <main className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin" className="text-sm font-semibold underline">Volver al panel</Link>
      <h1 className="mt-8 font-epilogue text-4xl font-black uppercase">Ranking de productos</h1>
      <p className="mt-3 text-sm text-neutral-600">Los productos más vendidos por cantidad o por importe, netos de devoluciones.</p>
      <div className="mt-8">
        <AdminRanking iniciales={iniciales} categorias={categorias.map(({ id, nombre }) => ({ id, nombre }))} />
      </div>
    </div>
  </main>;
}
