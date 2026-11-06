"use client";

import { useEffect, useState, type FormEvent } from "react";
import AdminInformes from "@/components/AdminInformes";
import { GraficoPrecios, GraficoUnidadesDiarias, TablaGrafico } from "@/components/GraficosEstadisticas";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import { fechaLarga, nombreCanal, parametros, precioPublicadoDelDia } from "@/lib/estadisticas";
import { formatearDinero, formatearFechaHora } from "@/lib/venta-local";
import type { CanalVenta, EstadisticasProducto } from "@/types/estadisticas";
import type { PaginaProveedores } from "@/types/proveedor";

const inputClass = "mt-1 block w-full border border-black bg-white p-2 text-sm";
type Estado = "cargando" | "listo" | "error" | "denegado" | "inexistente";
type Opcion = { id: number; nombre: string };

function Dato({ titulo, valor, detalle, destacada = false }: { titulo: string; valor: string; detalle?: string; destacada?: boolean }) {
  return <div className={`border border-black p-5 ${destacada ? "bg-black text-white" : "bg-white"}`}>
    <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${destacada ? "text-neutral-300" : "text-neutral-500"}`}>{titulo}</p>
    <p className="mt-3 font-epilogue text-3xl font-black">{valor}</p>
    {detalle && <p className={`mt-1 text-sm ${destacada ? "text-neutral-300" : "text-neutral-600"}`}>{detalle}</p>}
  </div>;
}

export default function AdminTrazabilidadProducto({ productoId, desdeInicial, hastaInicial }: {
  productoId: number; desdeInicial: string; hastaInicial: string;
}) {
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);
  const [canal, setCanal] = useState<"" | CanalVenta>("");
  const [datos, setDatos] = useState<EstadisticasProducto | null>(null);
  const [proveedores, setProveedores] = useState<Opcion[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");

  async function consultar(evento?: FormEvent<HTMLFormElement>) {
    evento?.preventDefault();
    if (desde > hasta) { setEstado("error"); setError("La fecha desde no puede ser posterior a hasta."); return; }
    setEstado("cargando"); setError("");
    try {
      setDatos(await apiFetchAdmin<EstadisticasProducto>(
        `/estadisticas/productos/${productoId}?${parametros({ desde, hasta, canal })}`));
      setEstado("listo");
    } catch (falla) {
      if (falla instanceof ApiError && falla.status === 404) { setEstado("inexistente"); return; }
      setEstado(falla instanceof ApiError && [401, 403].includes(falla.status) ? "denegado" : "error");
      setError(falla instanceof ApiError ? falla.message : "No pudimos cargar las estadísticas. Reintentá.");
    }
  }

  useEffect(() => {
    // Primera carga con el período recibido.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void consultar();
    apiFetchAdmin<PaginaProveedores>("/proveedores?activo=true&pagina=1&limite=100")
      .then((pagina) => setProveedores(pagina.datos.map(({ id, nombre }) => ({ id, nombre }))))
      .catch(() => setProveedores([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado === "inexistente") {
    return <p role="alert" className="border border-black bg-white p-4">El producto no existe.</p>;
  }

  const serie = datos?.serieDiaria.map((dia) => ({
    fecha: dia.fecha,
    unidades: dia.unidadesNetas,
    publicado: precioPublicadoDelDia(datos.precios, dia.fecha),
    cobrado: dia.precioPromedio === null ? null : Number(dia.precioPromedio),
  })) ?? [];

  return <div className="space-y-8">
    {datos && <header className="flex items-center gap-4">
      {datos.producto.imagen
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={datos.producto.imagen} alt="" className="h-20 w-20 border border-black object-cover" />
        : <div className="h-20 w-20 border border-black bg-white" />}
      <div>
        <h1 className="font-epilogue text-4xl font-black uppercase">{datos.producto.nombre}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {datos.producto.categoria ?? "Sin categoría"} · precio actual {formatearDinero(datos.producto.precioActual)}
          {" · "}{[datos.producto.web && "web", datos.producto.local && "local"].filter(Boolean).join(" y ") || "sin canal de venta"}
          {datos.producto.activo ? "" : " · inactivo"}
        </p>
      </div>
    </header>}

    <form onSubmit={(evento) => void consultar(evento)} className="grid gap-3 border-y border-black py-5 sm:grid-cols-4 sm:items-end">
      <label className="text-sm font-semibold">Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required className={inputClass} /></label>
      <label className="text-sm font-semibold">Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required className={inputClass} /></label>
      <label className="text-sm font-semibold">Canal
        <select value={canal} onChange={(e) => setCanal(e.target.value as typeof canal)} className={inputClass}>
          <option value="">Todos</option><option value="web">Web</option><option value="local">Local</option>
        </select>
      </label>
      <button disabled={estado === "cargando"} className="bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Consultar</button>
    </form>

    {estado === "cargando" && <p role="status">Cargando estadísticas…</p>}
    {estado === "denegado" && <p role="alert" className="text-red-700">Acceso denegado. {error}</p>}
    {estado === "error" && <div role="alert" className="border border-red-700 p-4 text-sm text-red-700">
      <p>{error}</p><button type="button" onClick={() => void consultar()} className="mt-1 underline">Reintentar</button>
    </div>}

    {datos && estado !== "denegado" && <>
      <section className="grid gap-4 md:grid-cols-4" aria-label="Totales del período">
        <Dato destacada titulo="Unidades netas" valor={String(datos.totales.unidadesNetas)}
          detalle={`${datos.totales.unidadesVendidas} vendidas · ${datos.totales.unidadesDevueltas} devueltas`} />
        <Dato titulo="Importe neto" valor={formatearDinero(datos.totales.importeNeto)}
          detalle={`${formatearDinero(datos.totales.importeDevuelto)} devuelto`} />
        <Dato titulo="Posición en el ranking" valor={datos.posicion ? `#${datos.posicion}` : "—"}
          detalle={datos.posicion ? "Por unidades netas del período" : "Sin ventas en el período"} />
        <Dato titulo="Stock actual" valor={String(datos.producto.stockFisicoActual)}
          detalle={`Precio promedio cobrado ${datos.totales.precioPromedio ? formatearDinero(datos.totales.precioPromedio) : "—"}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <GraficoPrecios serie={serie} />
          <TablaGrafico columnas={["Día", "Precio publicado", "Promedio cobrado"]}
            filas={serie.map((dia) => [fechaLarga(dia.fecha), formatearDinero(dia.publicado), formatearDinero(dia.cobrado)])} />
        </div>
        <div>
          <GraficoUnidadesDiarias serie={serie} />
          <TablaGrafico columnas={["Día", "Unidades netas", "Importe neto"]}
            filas={datos.serieDiaria.map((dia) => [fechaLarga(dia.fecha), dia.unidadesNetas, formatearDinero(dia.importeNeto)])} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="border border-black bg-white p-5 text-sm">
          <h2 className="font-epilogue text-xl font-black uppercase">Por canal</h2>
          <ul className="mt-3 divide-y">{datos.canales.map((item) => <li key={item.canal} className="flex justify-between py-2">
            <span>{nombreCanal(item.canal)}</span><span>{item.unidadesNetas} u. · {formatearDinero(item.importeNeto)}</span>
          </li>)}</ul>
        </div>
        <div className="border border-black bg-white p-5 text-sm lg:col-span-2">
          <h2 className="font-epilogue text-xl font-black uppercase">Por variante</h2>
          {datos.variantes.length === 0 ? <p className="mt-3">El producto no tiene variantes.</p> : <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="border-b border-black text-left text-xs uppercase">
                <tr><th className="py-2">Talle</th><th className="py-2">Color</th><th className="py-2 text-right">Stock</th><th className="py-2 text-right">Unidades netas</th><th className="py-2 text-right">Importe neto</th></tr>
              </thead>
              <tbody className="divide-y">{datos.variantes.map((variante) => <tr key={variante.varianteId ?? `${variante.talle}-${variante.color}`}>
                <td className="py-2">{variante.talle}</td><td className="py-2">{variante.color}</td>
                <td className="py-2 text-right">{variante.stock ?? "eliminada"}</td>
                <td className="py-2 text-right font-bold">{variante.unidadesNetas}</td>
                <td className="py-2 text-right">{formatearDinero(variante.importeNeto)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        </div>
      </section>

      <section className="border border-black bg-white p-5 text-sm">
        <h2 className="font-epilogue text-xl font-black uppercase">Historial de precios publicados</h2>
        {datos.precios.length === 0
          ? <p className="mt-3">No hay precios registrados para esas fechas. El historial empieza con la migración de vigencias de precio.</p>
          : <ul className="mt-3 divide-y">{datos.precios.map((precio, indice) => <li key={`${precio.inicio}-${indice}`} className="flex flex-wrap justify-between gap-2 py-2">
            <span>{precio.clase === "regular" ? "Regular" : "Promocional"} · <strong>{formatearDinero(precio.importe)}</strong></span>
            <span className="text-neutral-600">{formatearFechaHora(precio.inicio)} → {precio.fin ? formatearFechaHora(precio.fin) : "vigente"}</span>
          </li>)}</ul>}
      </section>

      <AdminInformes productoIdInicial={productoId}
        productos={[{ id: datos.producto.id, nombre: datos.producto.nombre }]}
        variantes={datos.variantes.filter((variante) => variante.varianteId !== null && variante.stock !== null)
          .map((variante) => ({ id: variante.varianteId as number, nombre: `${variante.talle} · ${variante.color}` }))}
        proveedores={proveedores} />
    </>}
  </div>;
}
