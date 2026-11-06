"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetchVendedor } from "@/lib/api";
import { etiquetaMedioPago, formatearDinero, formatearFechaHora, hoyBuenosAires } from "@/lib/venta-local";
import type { VentasLocalRespuesta } from "@/types/venta-local";

const inputClass = "w-full border-2 border-black bg-white px-3 py-2 text-sm";

export default function HistorialVentasLocal() {
  const [desde, setDesde] = useState(hoyBuenosAires);
  const [hasta, setHasta] = useState(hoyBuenosAires);
  const [buscar, setBuscar] = useState("");
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState<VentasLocalRespuesta | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const parametros = new URLSearchParams({ pagina: String(pagina) });
    if (desde) parametros.set("desde", desde);
    if (hasta) parametros.set("hasta", hasta);
    if (buscar.trim()) parametros.set("buscar", buscar.trim());
    try {
      setRespuesta(await apiFetchVendedor<VentasLocalRespuesta>(`/ventas?${parametros.toString()}`));
    } catch (falla) {
      setError(falla instanceof ApiError ? falla.message : "No pudimos cargar las ventas.");
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, buscar, pagina]);

  useEffect(() => {
    const espera = setTimeout(cargar, 300);
    return () => clearTimeout(espera);
  }, [cargar]);

  const totalPagina = respuesta?.ventas.reduce((suma, venta) => suma + Number(venta.total), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 border-2 border-black bg-white p-4 sm:grid-cols-3">
        <label className="text-xs font-bold uppercase">Desde
          <input type="date" value={desde} onChange={(event) => { setDesde(event.target.value); setPagina(1); }} className={`${inputClass} mt-1`} />
        </label>
        <label className="text-xs font-bold uppercase">Hasta
          <input type="date" value={hasta} onChange={(event) => { setHasta(event.target.value); setPagina(1); }} className={`${inputClass} mt-1`} />
        </label>
        <label className="text-xs font-bold uppercase">N.º de comprobante, nombre o teléfono
          <input value={buscar} onChange={(event) => { setBuscar(event.target.value); setPagina(1); }} className={`${inputClass} mt-1`} />
        </label>
      </div>

      {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}

      <div className="overflow-x-auto border-2 border-black bg-white">
        <table className={`w-full min-w-[640px] text-left text-sm ${cargando ? "opacity-60" : ""}`}>
          <thead className="bg-black text-xs uppercase tracking-wider text-white">
            <tr><th className="p-3">N.º</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Medio</th><th className="p-3">Unidades</th><th className="p-3 text-right">Total</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {respuesta?.ventas.map((venta) => (
              <tr key={venta.id} className="border-b border-neutral-200">
                <td className="p-3 font-bold">{String(venta.numeroComprobante).padStart(6, "0")}</td>
                <td className="p-3">{formatearFechaHora(venta.fecha)}</td>
                <td className="p-3">{[venta.nombreCliente, venta.telefonoCliente].filter(Boolean).join(" · ") || "-"}</td>
                <td className="p-3">{etiquetaMedioPago(venta.metodoPago)}</td>
                <td className="p-3">{venta.lineas.reduce((suma, linea) => suma + linea.cantidad, 0)}</td>
                <td className="p-3 text-right font-bold">{formatearDinero(venta.total)}</td>
                <td className="p-3 text-right"><Link href={`/vendedor/ventas/${venta.id}`} className="text-xs font-bold uppercase underline">Comprobante</Link></td>
              </tr>
            ))}
            {respuesta && respuesta.ventas.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-neutral-500">No hay ventas del local para estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {respuesta && respuesta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p>{respuesta.total} ventas · total de esta página {formatearDinero(totalPagina)}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="border-2 border-black px-3 py-1 text-xs font-bold uppercase disabled:opacity-40">Anterior</button>
            <span>{respuesta.pagina} / {respuesta.paginas}</span>
            <button type="button" disabled={pagina >= respuesta.paginas} onClick={() => setPagina(pagina + 1)} className="border-2 border-black px-3 py-1 text-xs font-bold uppercase disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
