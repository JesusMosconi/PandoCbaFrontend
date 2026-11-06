"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { GraficoVentasDiarias, TablaGrafico } from "@/components/GraficosEstadisticas";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import {
  COLOR_SERIE, PERIODOS_RAPIDOS, fechaLarga, nombreCanal, parametros, rangoPeriodo, type PeriodoRapido,
} from "@/lib/estadisticas";
import { formatearDinero } from "@/lib/venta-local";
import type { Metrica, ResumenInicio } from "@/types/estadisticas";

function Variacion({ metrica, invertida = false }: { metrica: Metrica<string | number>; invertida?: boolean }) {
  if (metrica.variacion === null) {
    return <span className="text-neutral-500">Sin ventas en el período anterior</span>;
  }
  const valor = metrica.variacion;
  const Icono = valor > 0 ? ArrowUpRight : valor < 0 ? ArrowDownRight : Minus;
  const texto = `${valor > 0 ? "+" : ""}${valor.toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
  return <span className="flex items-center gap-1">
    <Icono className="h-4 w-4" aria-hidden />
    <strong className={invertida ? "text-white" : "text-black"}>{texto}</strong>
    <span className={invertida ? "text-neutral-300" : "text-neutral-500"}>vs. período anterior</span>
  </span>;
}

function Indicador({ titulo, valor, metrica, ayuda, destacada = false }: {
  titulo: string; valor: string; metrica: Metrica<string | number>; ayuda: string; destacada?: boolean;
}) {
  return <div className={`flex flex-col justify-between border border-black p-5 ${destacada ? "bg-black text-white" : "bg-white"}`}>
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${destacada ? "text-neutral-300" : "text-neutral-500"}`} title={ayuda}>{titulo}</p>
      <p className="mt-3 font-epilogue text-3xl font-black leading-none">{valor}</p>
    </div>
    <div className={`mt-4 text-xs ${destacada ? "text-neutral-300" : "text-neutral-600"}`}><Variacion metrica={metrica} invertida={destacada} /></div>
  </div>;
}

export default function AdminInicio() {
  const [periodo, setPeriodo] = useState<PeriodoRapido>("30d");
  const [resumen, setResumen] = useState<ResumenInicio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true); setError("");
    apiFetchAdmin<ResumenInicio>(`/estadisticas/inicio?${parametros(rangoPeriodo(periodo))}`)
      .then((datos) => { if (vigente) setResumen(datos); })
      .catch((falla) => {
        if (vigente) setError(falla instanceof ApiError ? falla.message : "No pudimos cargar las métricas. Reintentá.");
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [periodo, intento]);

  const consultaPeriodo = resumen ? `desde=${resumen.desde}&hasta=${resumen.hasta}` : "";
  const totalCanales = resumen ? resumen.canales.reduce((suma, canal) => suma + Number(canal.total), 0) : 0;

  return <section aria-labelledby="metricas-inicio" className="space-y-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 id="metricas-inicio" className="font-epilogue text-2xl font-black uppercase">Ventas</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {resumen
            ? <>Del {fechaLarga(resumen.desde)} al {fechaLarga(resumen.hasta)} · web y local con pago confirmado. Se compara con el {fechaLarga(resumen.anterior.desde)} al {fechaLarga(resumen.anterior.hasta)}.</>
            : "Órdenes web y del local con pago confirmado."}
        </p>
      </div>
      <div role="group" aria-label="Período" className="flex shrink-0 border border-black text-xs font-bold uppercase">
        {PERIODOS_RAPIDOS.map(({ valor, etiqueta }) => <button key={valor} type="button" aria-pressed={periodo === valor}
          onClick={() => setPeriodo(valor)} disabled={cargando && periodo === valor}
          className={`px-3 py-2 ${periodo === valor ? "bg-black text-white" : "bg-white hover:bg-neutral-100"}`}>{etiqueta}</button>)}
      </div>
    </div>

    {error && <div role="alert" className="border border-red-700 bg-white p-4 text-sm text-red-700">
      <p>{error}</p><button type="button" onClick={() => setIntento((actual) => actual + 1)} className="mt-1 underline">Reintentar</button>
    </div>}
    {cargando && !resumen && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Cargando métricas">
      {[0, 1, 2, 3].map((indice) => <div key={indice} className="h-32 animate-pulse border border-neutral-300 bg-white" />)}
    </div>}

    {resumen && <div className={`space-y-4 transition-opacity ${cargando ? "opacity-60" : ""}`} aria-busy={cargando}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador destacada titulo="Total vendido" valor={formatearDinero(resumen.metricas.total.actual)}
          metrica={resumen.metricas.total} ayuda="Suma de las órdenes con pago confirmado en el período, sin envío." />
        <Indicador titulo="Ventas" valor={String(resumen.metricas.cantidad.actual)}
          metrica={resumen.metricas.cantidad} ayuda="Cantidad de órdenes con pago confirmado." />
        <Indicador titulo="Ticket promedio" valor={formatearDinero(resumen.metricas.ticketPromedio.actual)}
          metrica={resumen.metricas.ticketPromedio} ayuda="Total vendido dividido por la cantidad de ventas." />
        <Indicador titulo="Unidades vendidas" valor={String(resumen.metricas.unidades.actual)}
          metrica={resumen.metricas.unidades} ayuda="Prendas del catálogo vendidas menos las devueltas. No incluye la venta rápida." />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GraficoVentasDiarias alto={280} serie={resumen.serieDiaria.map((dia) => ({ fecha: dia.fecha, web: Number(dia.web), local: Number(dia.local) }))} />
          <TablaGrafico columnas={["Día", "Web", "Local", "Total"]}
            filas={resumen.serieDiaria.map((dia) => [fechaLarga(dia.fecha), formatearDinero(dia.web), formatearDinero(dia.local), formatearDinero(dia.total)])} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-black bg-white p-5 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">Por canal</p>
            {totalCanales > 0 && <div className="mt-4 flex h-3 w-full gap-0.5" aria-hidden>
              {resumen.canales.filter((canal) => Number(canal.total) > 0).map((canal) => <span key={canal.canal}
                style={{ width: `${(Number(canal.total) / totalCanales) * 100}%`, background: COLOR_SERIE[canal.canal] }} />)}
            </div>}
            <ul className="mt-4 space-y-3">
              {resumen.canales.map((canal) => <li key={canal.canal}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold">
                    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_SERIE[canal.canal] }} />
                    {nombreCanal(canal.canal)}
                  </span>
                  <span className="font-bold">{formatearDinero(canal.total)}
                    {totalCanales > 0 && <span className="ml-1 font-normal text-neutral-500">({Math.round((Number(canal.total) / totalCanales) * 100)} %)</span>}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-600">{canal.cantidad} {canal.cantidad === 1 ? "venta" : "ventas"} · ticket {formatearDinero(canal.ticketPromedio)}</p>
              </li>)}
            </ul>
          </div>
          <div className="border border-black bg-white p-5 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">Devoluciones del período</p>
            <p className="mt-2 font-epilogue text-2xl font-black">{formatearDinero(resumen.devoluciones.importe)}</p>
            <p className="text-xs text-neutral-600">{resumen.devoluciones.unidades} {resumen.devoluciones.unidades === 1 ? "unidad devuelta" : "unidades devueltas"}. Ya están descontadas de las unidades y del ranking.</p>
          </div>
        </div>
      </div>

      <div className="border border-black bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-epilogue text-xl font-black uppercase">Más vendidos</h3>
          <Link href={`/admin/ranking?${consultaPeriodo}`} className="flex items-center gap-1 text-sm font-semibold underline">
            Ver ranking completo <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {resumen.topProductos.length === 0
          ? <p className="mt-3 text-sm text-neutral-600">No hubo ventas de productos del catálogo en el período.</p>
          : <ol className="mt-3 grid gap-x-8 text-sm md:grid-cols-2">
            {resumen.topProductos.map((fila) => <li key={fila.productoId} className="flex items-center justify-between gap-3 border-b border-neutral-200 py-2">
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-6 shrink-0 font-epilogue text-lg font-black">{fila.posicion}</span>
                {fila.imagen
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={fila.imagen} alt="" className="h-9 w-9 shrink-0 border border-neutral-300 object-cover" />
                  : <span className="h-9 w-9 shrink-0 border border-neutral-300 bg-neutral-100" />}
                <Link href={`/admin/productos/${fila.productoId}?${consultaPeriodo}`} className="truncate font-semibold underline-offset-2 hover:underline">{fila.nombre}</Link>
              </span>
              <span className="shrink-0 text-right">{fila.unidadesNetas} u. · {formatearDinero(fila.importeNeto)}</span>
            </li>)}
          </ol>}
      </div>
    </div>}
  </section>;
}
