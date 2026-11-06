"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import { useConfirmacion } from "@/components/useConfirmacion";
import {
  MEDIOS_PAGO_LOCAL, etiquetaMedioPago, formatearDinero, formatearFechaHora, hoyBuenosAires,
} from "@/lib/venta-local";
import type { Caja, PaginaCajas } from "@/types/caja";
import type { PaginaVentasAdmin, ResumenVentasCanal } from "@/types/venta-local";

const inputClass = "mt-1 block w-full border border-black bg-white p-2 text-sm";
const mediosPago = [{ valor: "manual", etiqueta: etiquetaMedioPago("manual") }, ...MEDIOS_PAGO_LOCAL];
const nombreCanal = (canal: string) => (canal === "local" ? "Local" : "Web");
const mensaje = (falla: unknown, alternativo: string) => (falla instanceof ApiError ? falla.message : alternativo);

function parametros(valores: Record<string, string | number>) {
  const resultado = new URLSearchParams();
  for (const [clave, valor] of Object.entries(valores)) if (valor !== "") resultado.set(clave, String(valor));
  return resultado;
}

type FiltrosVentas = { desde: string; hasta: string; canal: string; metodoPago: string };

function pedirVentas(filtros: FiltrosVentas, pagina: number) {
  return Promise.all([
    apiFetchAdmin<ResumenVentasCanal>(`/ventas/resumen?${parametros({ desde: filtros.desde, hasta: filtros.hasta })}`),
    apiFetchAdmin<PaginaVentasAdmin>(`/ventas?${parametros({ ...filtros, pagina, limite: 20 })}`),
  ]);
}

const pedirCajas = (pagina: number) => apiFetchAdmin<PaginaCajas>(`/cajas?${parametros({ pagina, limite: 10 })}`);

function CierreRespaldo({ caja, alCerrar }: { caja: Caja; alCerrar: () => Promise<void> }) {
  const { confirmar, dialogo } = useConfirmacion();
  const [efectivo, setEfectivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const valido = /^(0|[1-9]\d{0,11})([.,]\d{1,2})?$/.test(efectivo.trim());

  async function cerrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!valido || procesando) return;
    const aceptado = await confirmar(`¿Cerrar la caja #${caja.id} con ${formatearDinero(efectivo.replace(",", "."))} contados? El cierre no se puede deshacer y descarta las ventas en curso sin confirmar.`,
      { accion: "Cerrar caja", destructiva: true });
    if (!aceptado) return;
    setProcesando(true); setError("");
    try {
      await apiFetchAdmin(`/cajas/${caja.id}/cierre`, { method: "POST", body: JSON.stringify({
        efectivoDeclarado: efectivo.trim().replace(",", "."), ...(observacion.trim() ? { observacion: observacion.trim() } : {}),
      }) });
      await alCerrar();
    } catch (falla) {
      setError(mensaje(falla, "No pudimos cerrar la caja. Reintentá."));
    } finally { setProcesando(false); }
  }

  return <form onSubmit={(evento) => void cerrar(evento)} className="mt-3 grid gap-3 border-t border-black pt-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
    <label className="text-sm">Efectivo contado
      <input inputMode="decimal" value={efectivo} onChange={(e) => setEfectivo(e.target.value)} className={inputClass} required />
    </label>
    <label className="text-sm">Observación (opcional)
      <input value={observacion} maxLength={500} onChange={(e) => setObservacion(e.target.value)} className={inputClass} />
    </label>
    <button disabled={!valido || procesando} className="border border-black bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
      {procesando ? "Cerrando…" : "Cierre de respaldo"}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{error}</p>}
    {dialogo}
  </form>;
}

export default function AdminVentas() {
  const hoy = hoyBuenosAires();
  const [desde, setDesde] = useState(`${hoy.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(hoy);
  const [canal, setCanal] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [resumen, setResumen] = useState<ResumenVentasCanal | null>(null);
  const [ventas, setVentas] = useState<PaginaVentasAdmin | null>(null);
  const [cajas, setCajas] = useState<PaginaCajas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarCajas(pagina = 1) {
    try {
      setCajas(await pedirCajas(pagina));
    } catch (falla) {
      setError(mensaje(falla, "No pudimos cargar las cajas. Reintentá."));
    }
  }

  async function consultar(pagina = 1) {
    if (desde > hasta) { setError("Indicá un período válido."); return; }
    setCargando(true); setError("");
    try {
      const [nuevoResumen, nuevasVentas] = await pedirVentas({ desde, hasta, canal, metodoPago }, pagina);
      setResumen(nuevoResumen); setVentas(nuevasVentas);
    } catch (falla) {
      setError(mensaje(falla, "No pudimos cargar las ventas. Reintentá."));
    } finally { setCargando(false); }
  }

  useEffect(() => {
    // Carga inicial: mes en curso, sin filtros.
    const inicio = hoyBuenosAires();
    pedirVentas({ desde: `${inicio.slice(0, 7)}-01`, hasta: inicio, canal: "", metodoPago: "" }, 1)
      .then(([nuevoResumen, nuevasVentas]) => { setResumen(nuevoResumen); setVentas(nuevasVentas); })
      .catch((falla) => setError(mensaje(falla, "No pudimos cargar las ventas. Reintentá.")))
      .finally(() => setCargando(false));
    pedirCajas(1).then(setCajas).catch((falla) => setError(mensaje(falla, "No pudimos cargar las cajas.")));
  }, []);

  return <div className="space-y-10">
    <form onSubmit={(evento) => { evento.preventDefault(); void consultar(); }} className="grid gap-3 border-y border-black py-5 sm:grid-cols-5 sm:items-end">
      <label className="text-sm font-semibold">Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required className={inputClass} /></label>
      <label className="text-sm font-semibold">Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required className={inputClass} /></label>
      <label className="text-sm font-semibold">Canal
        <select value={canal} onChange={(e) => setCanal(e.target.value)} className={inputClass}>
          <option value="">Todos</option><option value="web">Web</option><option value="local">Local</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Medio de pago
        <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className={inputClass}>
          <option value="">Todos</option>
          {mediosPago.map(({ valor, etiqueta }) => <option key={valor} value={valor}>{etiqueta}</option>)}
        </select>
      </label>
      <button disabled={cargando} className="bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Consultar</button>
    </form>

    {error && <p role="alert" className="border border-red-700 p-4 text-sm text-red-700">{error}</p>}
    {cargando && !resumen && <p role="status">Cargando ventas…</p>}

    {resumen && <section aria-labelledby="resumen-canal">
      <h2 id="resumen-canal" className="font-epilogue text-2xl font-black uppercase">Resumen del período</h2>
      <p className="mt-1 text-sm text-neutral-600">Órdenes con pago confirmado entre el {resumen.desde} y el {resumen.hasta}. Importes de mercadería; las devoluciones se informan aparte.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="border border-black bg-black p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300">Total</p>
          <p className="mt-3 font-epilogue text-3xl font-black">{formatearDinero(resumen.total)}</p>
          <p className="mt-1 text-sm text-neutral-300">{resumen.cantidad} ventas</p>
        </div>
        {resumen.canales.map((item) => <div key={item.canal} className="border border-black bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">{nombreCanal(item.canal)}</p>
          <p className="mt-3 font-epilogue text-3xl font-black">{formatearDinero(item.total)}</p>
          <p className="mt-1 text-sm text-neutral-600">{item.cantidad} ventas</p>
          {item.medios.length > 0 && <table className="mt-4 w-full text-sm">
            <tbody className="divide-y">
              {item.medios.map((medio) => <tr key={medio.metodoPago}>
                <td className="py-1">{etiquetaMedioPago(medio.metodoPago)}</td>
                <td className="py-1 text-right">{medio.cantidad}</td>
                <td className="py-1 text-right font-bold">{formatearDinero(medio.total)}</td>
              </tr>)}
            </tbody>
          </table>}
        </div>)}
      </div>
    </section>}

    {ventas && <section aria-labelledby="listado-ventas">
      <h2 id="listado-ventas" className="font-epilogue text-2xl font-black uppercase">Ventas</h2>
      {ventas.ventas.length === 0 ? <p className="mt-3 text-sm">No hay ventas para estos filtros.</p> : <div className="mt-3 overflow-x-auto border border-black bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-black text-left text-xs uppercase">
            <tr><th className="p-3">Orden</th><th className="p-3">Canal</th><th className="p-3">Pago</th><th className="p-3">Comprobante</th><th className="p-3">Cliente</th><th className="p-3">Medio</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y">
            {ventas.ventas.map((venta) => <tr key={venta.id}>
              <td className="p-3">#{venta.id}</td>
              <td className="p-3">{nombreCanal(venta.canal)}</td>
              <td className="p-3">{formatearFechaHora(venta.fechaPago)}</td>
              <td className="p-3">{venta.numeroComprobante ? <Link href={`/vendedor/ventas/${venta.id}`} className="underline">N.º {venta.numeroComprobante}</Link> : "-"}</td>
              <td className="p-3">{[venta.nombreCliente, venta.telefonoCliente].filter(Boolean).join(" · ") || "-"}</td>
              <td className="p-3">{etiquetaMedioPago(venta.metodoPago)}</td>
              <td className="p-3 text-right font-bold">{formatearDinero(venta.total)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
      {ventas.paginas > 1 && <div className="mt-3 flex items-center gap-4 text-sm">
        <button type="button" disabled={ventas.pagina <= 1 || cargando} onClick={() => void consultar(ventas.pagina - 1)} className="underline disabled:opacity-40">Anterior</button>
        <span>Página {ventas.pagina} de {ventas.paginas}</span>
        <button type="button" disabled={ventas.pagina >= ventas.paginas || cargando} onClick={() => void consultar(ventas.pagina + 1)} className="underline disabled:opacity-40">Siguiente</button>
      </div>}
    </section>}

    {cajas && <section aria-labelledby="historial-cajas">
      <h2 id="historial-cajas" className="font-epilogue text-2xl font-black uppercase">Cajas del local</h2>
      {cajas.cajas.length === 0 ? <p className="mt-3 text-sm">Todavía no se abrió ninguna caja.</p> : <ul className="mt-3 space-y-3">
        {cajas.cajas.map((caja) => <li key={caja.id} className="border border-black bg-white p-4 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong>
              Caja #{caja.id} · {caja.estado === "abierta" ? "Abierta" : "Cerrada"}
              {caja.deJornadaAnterior && <span className="ml-2 text-red-700">· De un día anterior: cerrala para seguir vendiendo</span>}
            </strong>
            <span>{formatearFechaHora(caja.abiertaEn)}{caja.cerradaEn ? ` → ${formatearFechaHora(caja.cerradaEn)}` : ""}</span>
          </div>
          <p className="mt-2">Inicial {formatearDinero(caja.efectivoInicial)} · {caja.cantidadVentas} ventas por {formatearDinero(caja.totalVentas)} · efectivo esperado {formatearDinero(caja.efectivoEsperado)}</p>
          <p className="mt-1 text-neutral-600">{Object.entries(caja.totalesPorMedio).map(([medio, total]) => `${etiquetaMedioPago(medio)} ${formatearDinero(total)}`).join(" · ") || "Sin ventas"}</p>
          {caja.estado === "cerrada"
            ? <p className="mt-1">Contado {formatearDinero(caja.efectivoDeclarado)} · diferencia <strong className={Number(caja.diferencia) === 0 ? "" : "text-red-700"}>{formatearDinero(caja.diferencia)}</strong>{caja.observacion ? ` · ${caja.observacion}` : ""}</p>
            : <CierreRespaldo caja={caja} alCerrar={async () => { await cargarCajas(cajas.pagina); await consultar(ventas?.pagina ?? 1); }} />}
        </li>)}
      </ul>}
      {cajas.paginas > 1 && <div className="mt-3 flex items-center gap-4 text-sm">
        <button type="button" disabled={cajas.pagina <= 1} onClick={() => void cargarCajas(cajas.pagina - 1)} className="underline disabled:opacity-40">Anterior</button>
        <span>Página {cajas.pagina} de {cajas.paginas}</span>
        <button type="button" disabled={cajas.pagina >= cajas.paginas} onClick={() => void cargarCajas(cajas.pagina + 1)} className="underline disabled:opacity-40">Siguiente</button>
      </div>}
    </section>}
  </div>;
}
