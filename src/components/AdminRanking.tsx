"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { GraficoTopRanking } from "@/components/GraficosEstadisticas";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import { parametros } from "@/lib/estadisticas";
import { formatearDinero } from "@/lib/venta-local";
import type { Categoria } from "@/types/categoria";
import type { CanalVenta, FilaRanking, FiltrosRanking, OrdenRanking, PaginaRanking } from "@/types/estadisticas";

const inputClass = "mt-1 block w-full border border-black bg-white p-2 text-sm";
const importeValido = (valor: string) => valor === "" || /^(0|[1-9]\d*)(?:[.,]\d{1,2})?$/.test(valor.trim());

type Estado = "cargando" | "listo" | "error" | "denegado";

export type FiltrosRankingIniciales = {
  desde: string; hasta: string; canal: "" | CanalVenta; categoriaId: string; orden: OrdenRanking;
  minUnidades: string; minImporte: string;
};

export default function AdminRanking({ iniciales, categorias }: {
  iniciales: FiltrosRankingIniciales; categorias: Pick<Categoria, "id" | "nombre">[];
}) {
  const [filtros, setFiltros] = useState(iniciales);
  const [aplicados, setAplicados] = useState(iniciales);
  const [resultado, setResultado] = useState<PaginaRanking | null>(null);
  const [top, setTop] = useState<FilaRanking[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");
  const cambiar = <K extends keyof FiltrosRankingIniciales>(clave: K, valor: FiltrosRankingIniciales[K]) =>
    setFiltros((actuales) => ({ ...actuales, [clave]: valor }));

  async function consultar(valores: FiltrosRankingIniciales, pagina = 1) {
    if (valores.desde > valores.hasta) { setEstado("error"); setError("La fecha desde no puede ser posterior a hasta."); return; }
    if (!/^\d*$/.test(valores.minUnidades) || !importeValido(valores.minImporte)) {
      setEstado("error"); setError("Revisá los mínimos: unidades enteras e importe con hasta dos decimales."); return;
    }
    const consulta: FiltrosRanking = {
      desde: valores.desde, hasta: valores.hasta, orden: valores.orden, pagina, limite: 20,
      ...(valores.canal ? { canal: valores.canal } : {}),
      ...(valores.categoriaId ? { categoriaId: Number(valores.categoriaId) } : {}),
      ...(valores.minUnidades ? { minUnidades: Number(valores.minUnidades) } : {}),
      ...(valores.minImporte ? { minImporte: valores.minImporte.trim().replace(",", ".") } : {}),
    };
    setEstado("cargando"); setError("");
    try {
      const pedido = await apiFetchAdmin<PaginaRanking>(`/estadisticas/ranking?${parametros(consulta)}`);
      setResultado(pedido);
      if (pagina === 1) setTop(pedido.datos.slice(0, 10));
      setAplicados(valores);
      setEstado("listo");
      window.history.replaceState(null, "", `?${parametros({ ...consulta, pagina: undefined, limite: undefined })}`);
    } catch (falla) {
      setEstado(falla instanceof ApiError && [401, 403].includes(falla.status) ? "denegado" : "error");
      setError(falla instanceof ApiError ? falla.message : "No pudimos cargar el ranking. Reintentá.");
    }
  }

  useEffect(() => {
    // Primera carga con los filtros de la URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void consultar(iniciales);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void consultar(filtros);
  }

  const porImporte = (resultado?.filtros.orden ?? filtros.orden) === "importe";

  return <div className="space-y-8">
    <form onSubmit={enviar} className="grid gap-3 border-y border-black py-5 sm:grid-cols-4 sm:items-end">
      <label className="text-sm font-semibold">Desde<input type="date" value={filtros.desde} onChange={(e) => cambiar("desde", e.target.value)} required className={inputClass} /></label>
      <label className="text-sm font-semibold">Hasta<input type="date" value={filtros.hasta} onChange={(e) => cambiar("hasta", e.target.value)} required className={inputClass} /></label>
      <label className="text-sm font-semibold">Canal
        <select value={filtros.canal} onChange={(e) => cambiar("canal", e.target.value as FiltrosRankingIniciales["canal"])} className={inputClass}>
          <option value="">Todos</option><option value="web">Web</option><option value="local">Local</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Categoría
        <select value={filtros.categoriaId} onChange={(e) => cambiar("categoriaId", e.target.value)} className={inputClass}>
          <option value="">Todas</option>
          {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
        </select>
      </label>
      <fieldset className="text-sm font-semibold">
        <legend>Ordenar por</legend>
        <div className="mt-1 grid grid-cols-2 border border-black">
          {(["unidades", "importe"] as const).map((valor) => <label key={valor}
            className={`cursor-pointer p-2 text-center ${filtros.orden === valor ? "bg-black text-white" : "bg-white"}`}>
            <input type="radio" name="orden" value={valor} checked={filtros.orden === valor} onChange={() => cambiar("orden", valor)} className="sr-only" />
            {valor === "unidades" ? "Cantidad" : "Importe"}
          </label>)}
        </div>
      </fieldset>
      <label className="text-sm font-semibold">Mínimo de unidades
        <input inputMode="numeric" value={filtros.minUnidades} onChange={(e) => cambiar("minUnidades", e.target.value)} placeholder="0" className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Mínimo de importe
        <input inputMode="decimal" value={filtros.minImporte} onChange={(e) => cambiar("minImporte", e.target.value)} placeholder="0,00" className={inputClass} />
      </label>
      <button disabled={estado === "cargando"} className="bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Consultar</button>
    </form>

    <p className="text-sm text-neutral-600">Órdenes web y del local con pago confirmado en el período, menos las devoluciones aceptadas en el período. Las líneas de venta rápida no se incluyen.</p>

    {estado === "cargando" && <p role="status">Cargando ranking…</p>}
    {estado === "denegado" && <p role="alert" className="text-red-700">Acceso denegado. {error}</p>}
    {estado === "error" && <div role="alert" className="border border-red-700 p-4 text-sm text-red-700">
      <p>{error}</p><button type="button" onClick={() => void consultar(filtros)} className="mt-1 underline">Reintentar</button>
    </div>}

    {resultado && estado !== "denegado" && (resultado.datos.length === 0
      ? <p role="status" className="border border-black bg-white p-4 text-sm">No hay ventas para estos filtros.</p>
      : <>
        {top.length > 0 && <GraficoTopRanking metrica={porImporte ? "importe" : "unidades"}
          filas={top.map((fila) => ({ nombre: fila.nombre, valor: porImporte ? Number(fila.importeNeto) : fila.unidadesNetas }))} />}
        <section aria-labelledby="tabla-ranking">
          <h2 id="tabla-ranking" className="font-epilogue text-2xl font-black uppercase">
            {resultado.totalResultados} productos vendidos
          </h2>
          <div className="mt-3 overflow-x-auto border border-black bg-white">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-black text-left text-xs uppercase">
                <tr>
                  <th className="p-3">#</th><th className="p-3">Producto</th>
                  <th className={`p-3 text-right ${porImporte ? "" : "underline"}`}>Unidades netas</th>
                  <th className="p-3 text-right">Devueltas</th>
                  <th className={`p-3 text-right ${porImporte ? "underline" : ""}`}>Importe neto</th>
                  <th className="p-3 text-right">Precio promedio</th><th className="p-3 text-right">Órdenes</th><th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {resultado.datos.map((fila) => <tr key={fila.productoId}>
                  <td className="p-3 font-epilogue text-lg font-black">{fila.posicion}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {fila.imagen
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={fila.imagen} alt="" className="h-10 w-10 border border-neutral-300 object-cover" />
                        : <div className="h-10 w-10 border border-neutral-300 bg-neutral-100" />}
                      <div>
                        <p className="font-semibold">{fila.nombre}</p>
                        <p className="text-xs text-neutral-600">{fila.categoria ?? "Sin categoría"} · precio actual {formatearDinero(fila.precioActual)}{fila.activo ? "" : " · inactivo"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold">{fila.unidadesNetas}</td>
                  <td className="p-3 text-right">{fila.unidadesDevueltas}</td>
                  <td className="p-3 text-right font-bold">{formatearDinero(fila.importeNeto)}</td>
                  <td className="p-3 text-right">{fila.precioPromedio ? formatearDinero(fila.precioPromedio) : "—"}</td>
                  <td className="p-3 text-right">{fila.cantidadOrdenes}</td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/productos/${fila.productoId}?desde=${resultado.filtros.desde}&hasta=${resultado.filtros.hasta}`} className="whitespace-nowrap underline">Estadísticas</Link>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {resultado.paginas > 1 && <div className="mt-3 flex items-center gap-4 text-sm">
            <button type="button" disabled={resultado.pagina <= 1 || estado === "cargando"} onClick={() => void consultar(aplicados, resultado.pagina - 1)} className="underline disabled:opacity-40">Anterior</button>
            <span>Página {resultado.pagina} de {resultado.paginas}</span>
            <button type="button" disabled={resultado.pagina >= resultado.paginas || estado === "cargando"} onClick={() => void consultar(aplicados, resultado.pagina + 1)} className="underline disabled:opacity-40">Siguiente</button>
          </div>}
        </section>
      </>)}
  </div>;
}
