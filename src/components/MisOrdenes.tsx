"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetchInterna } from "@/lib/api";
import type { Orden } from "@/types/orden";
import { tituloEstadoOrden } from "@/lib/estado-orden";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString("es-AR") : "No disponible";

async function consultarConLimite<T>(ruta: string, options: RequestInit = {}): Promise<T> {
  const control = new AbortController();
  const temporizador = window.setTimeout(() => control.abort(), 10_000);
  try {
    return await apiFetchInterna<T>(ruta, { ...options, signal: control.signal, cache: "no-store" });
  } finally {
    window.clearTimeout(temporizador);
  }
}

export default function MisOrdenes() {
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null);
  const [detalle, setDetalle] = useState<Orden | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState("");
  const [errorDetalle, setErrorDetalle] = useState("");
  const [cancelando, setCancelando] = useState(false);

  async function cargar() {
    setError("");
    try {
      const lista = await consultarConLimite<Orden[]>("/api/ordenes");
      setOrdenes(lista);
      if (detalle) {
        const actual = lista.find((orden) => orden.id === detalle.id);
        if (actual) setDetalle(actual);
      }
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "La consulta tardó demasiado o falló. Reintentá.");
    }
  }

  async function abrir(id: number) {
    setCargandoDetalle(true);
    setErrorDetalle("");
    try {
      setDetalle(await consultarConLimite<Orden>(`/api/ordenes/${id}`));
    } catch (causa) {
      setErrorDetalle(causa instanceof ApiError ? causa.message : "No pudimos cargar el detalle. Reintentá.");
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function cancelar() {
    if (!detalle?.puedeCancelar || cancelando) return;
    if (!window.confirm(`¿Cancelar la orden #${detalle.id}? Se liberará la reserva de productos.`)) return;
    setCancelando(true);
    setErrorDetalle("");
    try {
      const actual = await consultarConLimite<Orden>(`/api/ordenes/${detalle.id}/cancelacion`, { method: "POST" });
      setDetalle(actual);
      await cargar();
    } catch (causa) {
      const mensaje = causa instanceof ApiError ? causa.message : "No pudimos cancelar. Consultá el estado y reintentá.";
      await abrir(detalle.id);
      await cargar();
      setErrorDetalle(mensaje);
    } finally {
      setCancelando(false);
    }
  }

  useEffect(() => {
    let activo = true;
    const control = new AbortController();
    const temporizador = window.setTimeout(() => control.abort(), 10_000);
    apiFetchInterna<Orden[]>("/api/ordenes", { signal: control.signal, cache: "no-store" })
      .then((lista) => { if (activo) { setOrdenes(lista); setError(""); } })
      .catch((causa) => {
        if (activo) setError(causa instanceof ApiError ? causa.message : "La consulta tardó demasiado o falló. Reintentá.");
      })
      .finally(() => window.clearTimeout(temporizador));
    return () => { activo = false; control.abort(); window.clearTimeout(temporizador); };
  }, []);

  const detalleId = detalle?.id;
  const pendienteAbierta = detalle?.estado === "pendiente_pago";
  const hayPendientes = Boolean(ordenes?.some((orden) => orden.estado === "pendiente_pago"));

  useEffect(() => {
    if (!hayPendientes && !pendienteAbierta) return;
    const temporizador = window.setInterval(() => {
      if (!navigator.onLine) return;
      apiFetchInterna<Orden[]>("/api/ordenes", { cache: "no-store" })
        .then(setOrdenes)
        .catch(() => setError("No pudimos actualizar las órdenes. Reintentá."));
      if (pendienteAbierta && detalleId) {
        apiFetchInterna<Orden>(`/api/ordenes/${detalleId}`, { cache: "no-store" })
          .then(setDetalle)
          .catch(() => setErrorDetalle("No pudimos actualizar el estado de la orden. Reintentá."));
      }
    }, 60_000);
    return () => window.clearInterval(temporizador);
  }, [detalleId, pendienteAbierta, hayPendientes]);

  return <section className="mt-14 border-t-2 border-black pt-8" aria-labelledby="mis-ordenes">
    <div className="flex items-center justify-between gap-4">
      <h2 id="mis-ordenes" className="font-epilogue text-2xl font-bold uppercase">Mis órdenes</h2>
      <button type="button" onClick={() => void cargar()} className="text-sm font-semibold underline">Actualizar</button>
    </div>
    {ordenes === null && !error && <p className="mt-5" role="status">Cargando órdenes...</p>}
    {error && <div className="mt-5" role="alert"><p className="text-red-700">{error}</p><button type="button" onClick={() => void cargar()} className="mt-2 underline">Reintentar</button></div>}
    {ordenes?.length === 0 && !error && <p className="mt-5">Todavía no tenés órdenes.</p>}
    {!!ordenes?.length && <div className="mt-5 divide-y divide-gray-300 border-y border-black">
      {ordenes.map((orden) => <div key={orden.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div><p className="font-semibold">Orden #{orden.id}</p><p className="text-sm">{tituloEstadoOrden(orden.estadoVisible)}</p><p className="text-sm text-gray-600">{fecha(orden.creadaEn)}</p></div>
        <button type="button" onClick={() => void abrir(orden.id)} className="border border-black px-4 py-2 text-sm font-semibold">Ver detalle</button>
      </div>)}
    </div>}
    {cargandoDetalle && <p className="mt-6" role="status">Cargando detalle...</p>}
    {errorDetalle && <div className="mt-6" role="alert"><p className="text-red-700">{errorDetalle}</p>{detalle && <button type="button" onClick={() => void abrir(detalle.id)} className="mt-2 underline">Reintentar detalle</button>}</div>}
    {detalle && <article className="mt-8 border border-black p-5" aria-labelledby="detalle-orden">
      <div className="flex items-start justify-between gap-4"><h3 id="detalle-orden" className="font-epilogue text-xl font-bold uppercase">Orden #{detalle.id}</h3><button type="button" onClick={() => setDetalle(null)} aria-label="Cerrar detalle" className="underline">Cerrar</button></div>
      <p className="mt-3">Estado: {tituloEstadoOrden(detalle.estadoVisible)}</p>
      {detalle.estadoVisible === "reserva_vencida_en_proceso" && <p className="mt-2 text-amber-800" role="status">Reserva vencida; cancelación en proceso.</p>}
      {detalle.venceEn && <p className="mt-2">Reserva hasta: {fecha(detalle.venceEn)}</p>}
      {detalle.canceladaEn && <p className="mt-2">Cancelada: {fecha(detalle.canceladaEn)}</p>}
      <div className="mt-5 divide-y divide-gray-200 border-y">
        {detalle.detalles.map((linea) => <p key={linea.posicion} className="flex justify-between gap-4 py-3"><span>{linea.nombreProducto} · {linea.talle} / {linea.color} × {linea.cantidad}</span><span>{moneda.format(Number(linea.importeLinea))}</span></p>)}
      </div>
      <p className="mt-4 flex justify-between"><span>Subtotal de productos</span><strong>{moneda.format(Number(detalle.subtotalProductos))}</strong></p>
      {detalle.estadoCostoEnvio === "sin_cotizar" ? <><p className="mt-2">Envío: costo a coordinar</p><p className="mt-2 font-semibold">Total final pendiente.</p></>
        : detalle.estadoCostoEnvio === "no_aplica" ? <p className="mt-2 flex justify-between"><span>Total</span><strong>{moneda.format(Number(detalle.totalFinal))}</strong></p>
          : <p className="mt-2">Importes heredados: total registrado {detalle.totalFinal === null ? "no disponible" : moneda.format(Number(detalle.totalFinal))}.</p>}
      {detalle.envioCoordinado && <p className="mt-3">Envío coordinado externamente el {fecha(detalle.envioCoordinadoEn)}. El costo aún no está cotizado aquí.</p>}
      {detalle.devolucion === "pendiente_de_gestionar" && <p className="mt-3">Devolución pendiente de gestionar.</p>}
      {detalle.puedeCancelar && <button type="button" disabled={cancelando} onClick={() => void cancelar()} className="mt-6 border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40">{cancelando ? "Cancelando..." : "Cancelar orden"}</button>}
    </article>}
  </section>;
}
