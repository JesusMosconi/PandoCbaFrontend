"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiFetchVendedor } from "@/lib/api";
import { useConfirmacion } from "@/components/useConfirmacion";
import { MEDIOS_PAGO_LOCAL, formatearDinero, formatearFechaHora } from "@/lib/venta-local";
import type { Caja, RespuestaCajaActual, RespuestaOperacionCaja } from "@/types/caja";

const inputClass = "w-full border-2 border-black bg-white px-3 py-2 text-sm";
const importeValido = (valor: string) => /^(0|[1-9]\d{0,11})([.,]\d{1,2})?$/.test(valor.trim());
const normalizarImporte = (valor: string) => valor.trim().replace(",", ".");

function ResumenCaja({ caja }: { caja: Caja }) {
  const medios = [...MEDIOS_PAGO_LOCAL.map((medio) => medio.valor),
    ...Object.keys(caja.totalesPorMedio).filter((medio) => !MEDIOS_PAGO_LOCAL.some((item) => item.valor === medio))];
  return (
    <dl className="grid gap-px border-2 border-black bg-black text-sm sm:grid-cols-2">
      <div className="bg-white p-4"><dt className="text-xs font-bold uppercase text-neutral-500">Apertura</dt><dd className="font-bold">{formatearFechaHora(caja.abiertaEn)}</dd></div>
      <div className="bg-white p-4"><dt className="text-xs font-bold uppercase text-neutral-500">Efectivo inicial</dt><dd className="font-bold">{formatearDinero(caja.efectivoInicial)}</dd></div>
      {medios.map((medio) => (
        <div key={medio} className="bg-white p-4">
          <dt className="text-xs font-bold uppercase text-neutral-500">{MEDIOS_PAGO_LOCAL.find((item) => item.valor === medio)?.etiqueta ?? medio}</dt>
          <dd className="font-bold">{formatearDinero(caja.totalesPorMedio[medio] ?? "0")}</dd>
        </div>
      ))}
      <div className="bg-white p-4"><dt className="text-xs font-bold uppercase text-neutral-500">Ventas</dt><dd className="font-bold">{caja.cantidadVentas} · {formatearDinero(caja.totalVentas)}</dd></div>
      <div className="bg-neutral-100 p-4"><dt className="text-xs font-bold uppercase text-neutral-500">Efectivo esperado en caja</dt><dd className="font-epilogue text-2xl font-black">{formatearDinero(caja.efectivoEsperado)}</dd></div>
      {caja.estado === "cerrada" && (
        <>
          <div className="bg-white p-4"><dt className="text-xs font-bold uppercase text-neutral-500">Cierre</dt><dd className="font-bold">{formatearFechaHora(caja.cerradaEn)}</dd></div>
          <div className="bg-white p-4"><dt className="text-xs font-bold uppercase text-neutral-500">Efectivo contado</dt><dd className="font-bold">{formatearDinero(caja.efectivoDeclarado)}</dd></div>
          <div className={`p-4 sm:col-span-2 ${Number(caja.diferencia) === 0 ? "bg-green-50" : "bg-red-50"}`}>
            <dt className="text-xs font-bold uppercase text-neutral-500">Diferencia</dt>
            <dd className="font-epilogue text-2xl font-black">{formatearDinero(caja.diferencia)}</dd>
            {caja.observacion && <p className="mt-1 text-xs">{caja.observacion}</p>}
          </div>
        </>
      )}
    </dl>
  );
}

export default function CajaPanel() {
  const { confirmar, dialogo } = useConfirmacion();
  const [caja, setCaja] = useState<Caja | null>(null);
  const [cerrada, setCerrada] = useState<Caja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [efectivoDeclarado, setEfectivoDeclarado] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const claveAperturaRef = useRef(crypto.randomUUID());

  const cargar = useCallback(async () => {
    try {
      setCaja((await apiFetchVendedor<RespuestaCajaActual>("/caja")).caja);
    } catch (falla) {
      setError(falla instanceof ApiError ? falla.message : "No pudimos consultar la caja.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    apiFetchVendedor<RespuestaCajaActual>("/caja")
      .then((respuesta) => setCaja(respuesta.caja))
      .catch((falla) => setError(falla instanceof ApiError ? falla.message : "No pudimos consultar la caja."))
      .finally(() => setCargando(false));
  }, []);

  async function abrir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!importeValido(efectivoInicial)) {
      setError("Ingresá el efectivo inicial (puede ser 0).");
      return;
    }
    setProcesando(true);
    setError("");
    try {
      const respuesta = await apiFetchVendedor<RespuestaOperacionCaja>("/caja/apertura", {
        method: "POST",
        body: JSON.stringify({ claveApertura: claveAperturaRef.current, efectivoInicial: normalizarImporte(efectivoInicial) }),
      });
      claveAperturaRef.current = crypto.randomUUID();
      setCaja(respuesta.caja);
      setCerrada(null);
      setEfectivoInicial("");
    } catch (falla) {
      setError(falla instanceof ApiError ? falla.message : "No pudimos abrir la caja. Reintentá.");
      if (falla instanceof ApiError && falla.codigo === "CAJA_YA_ABIERTA") await cargar();
    } finally {
      setProcesando(false);
    }
  }

  async function cerrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!caja) return;
    if (!importeValido(efectivoDeclarado)) {
      setError("Ingresá el efectivo contado en la caja.");
      return;
    }
    const diferencia = Number(normalizarImporte(efectivoDeclarado)) - Number(caja.efectivoEsperado);
    const aviso = diferencia === 0 ? "El efectivo coincide con lo esperado."
      : `Hay una diferencia de ${formatearDinero(diferencia)}.`;
    if (!await confirmar(`${aviso} Una vez cerrada, la caja no se puede reabrir y las ventas en curso sin confirmar se descartan.`,{ titulo: "Cerrar caja", accion: "Cerrar caja", destructiva: true })) return;
    setProcesando(true);
    setError("");
    try {
      const respuesta = await apiFetchVendedor<RespuestaOperacionCaja>("/caja/cierre", {
        method: "POST",
        body: JSON.stringify({ cajaId: caja.id, efectivoDeclarado: normalizarImporte(efectivoDeclarado), observacion }),
      });
      setCerrada(respuesta.caja);
      setCaja(null);
      setEfectivoDeclarado("");
      setObservacion("");
    } catch (falla) {
      setError(falla instanceof ApiError ? falla.message : "No pudimos cerrar la caja. Reintentá.");
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) return <p className="text-sm">Consultando la caja...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {dialogo}
      {error && <p role="alert" className="border-2 border-red-700 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p>}

      {cerrada && (
        <section className="space-y-3">
          <h2 className="font-epilogue text-xl font-black uppercase">Caja cerrada</h2>
          <ResumenCaja caja={cerrada} />
        </section>
      )}

      {!caja ? (
        <form onSubmit={abrir} className="space-y-4 border-2 border-black bg-white p-6">
          <h2 className="font-epilogue text-xl font-black uppercase">Abrir caja</h2>
          <p className="text-sm text-neutral-600">Indicá el efectivo con el que empieza la caja. Mientras la caja esté abierta se pueden registrar ventas.</p>
          <label className="block text-xs font-bold uppercase tracking-wider">Efectivo inicial
            <input value={efectivoInicial} onChange={(event) => setEfectivoInicial(event.target.value)} inputMode="decimal" placeholder="0" className={`${inputClass} mt-1`} />
          </label>
          <button disabled={procesando} className="bg-black px-6 py-3 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-50">
            {procesando ? "Abriendo..." : "Abrir caja"}
          </button>
        </form>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-epilogue text-xl font-black uppercase">Caja abierta</h2>
              <Link href="/vendedor" className="text-xs font-bold uppercase underline">Ir a vender</Link>
            </div>
            {caja.deJornadaAnterior && (
              <p role="alert" className="border-2 border-red-700 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
                Esta caja se abrió un día anterior. Contá el efectivo, cerrala y abrí una nueva para seguir vendiendo.
              </p>
            )}
            <ResumenCaja caja={caja} />
          </section>
          <form onSubmit={cerrar} className="space-y-4 border-2 border-black bg-white p-6">
            <h2 className="font-epilogue text-xl font-black uppercase">Cerrar caja</h2>
            <label className="block text-xs font-bold uppercase tracking-wider">Efectivo contado
              <input value={efectivoDeclarado} onChange={(event) => setEfectivoDeclarado(event.target.value)} inputMode="decimal" className={`${inputClass} mt-1`} />
            </label>
            {importeValido(efectivoDeclarado) && (
              <p className="text-sm">Diferencia: <strong>{formatearDinero(Number(normalizarImporte(efectivoDeclarado)) - Number(caja.efectivoEsperado))}</strong></p>
            )}
            <label className="block text-xs font-bold uppercase tracking-wider">Observación (opcional)
              <textarea value={observacion} onChange={(event) => setObservacion(event.target.value)} maxLength={500} className={`${inputClass} mt-1 min-h-20`} />
            </label>
            <button disabled={procesando} className="border-2 border-black bg-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50">
              {procesando ? "Cerrando..." : "Cerrar caja"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
