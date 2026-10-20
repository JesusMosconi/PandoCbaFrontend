"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import type { EstadoConsultaInforme, FiltrosInforme, HistorialProducto, InformeComprasVentas } from "@/types/informe";

type Opcion = { id: number; nombre: string };
type Props = { productoIdInicial?: number; productos: Opcion[]; variantes: Opcion[]; proveedores: Opcion[] };
const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fechaActual = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
const parteFecha = (tipo: "year" | "month" | "day") => fechaActual.find((parte) => parte.type === tipo)?.value ?? "";
const hoy = `${parteFecha("year")}-${parteFecha("month")}-${parteFecha("day")}`;
const comienzoMes = `${hoy.slice(0, 7)}-01`;
const mostrarFecha = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor)
  ? valor.split("-").reverse().join("/") : new Date(valor).toLocaleDateString("es-AR");

function resumenVisible(informe: InformeComprasVentas, titulo: string) {
  const { resumen } = informe;
  return <div className="border border-black p-4 text-sm">
    <h4 className="font-bold">{titulo}</h4>
    <p className="mt-2">Compras: {moneda.format(Number(resumen.compras))} · ajustes de compras: {moneda.format(Number(resumen.diferenciaCompras))} · gastos adicionales: {moneda.format(Number(resumen.gastosAdicionales))}</p>
    <p>Ventas atribuidas: {moneda.format(Number(resumen.importeVentaAtribuido))} · costo vendido conocido: {moneda.format(Number(resumen.costoVendidoConocido))}</p>
    <p>Reintegros efectivos: {moneda.format(Number(resumen.importeReintegrado))} · costo revertido: {moneda.format(Number(resumen.costoRevertido))} · reintegro pendiente al cierre: {moneda.format(Number(resumen.importeReintegroPendiente))}</p>
    <p>Devoluciones a proveedor: {moneda.format(Number(resumen.devolucionesProveedor))} · diferencia de costo de ventas: {moneda.format(Number(resumen.diferenciaCorrecciones))}</p>
    <p className="mt-2 font-bold">Margen bruto de mercadería: {resumen.margenBruto === null ? "indeterminado" : moneda.format(Number(resumen.margenBruto))}</p>
    {resumen.advertenciaCobertura && <p className="text-amber-800">{resumen.advertenciaCobertura}</p>}
    <p className="mt-1 text-neutral-600">{informe.totalResultados} hechos; origen de proveedor desconocido en ventas: {moneda.format(Number(informe.origenDesconocido))}. El margen no incluye gastos ni envío.</p>
  </div>;
}

export default function AdminInformes({ productoIdInicial, productos, variantes, proveedores }: Props) {
  const [desde, setDesde] = useState(comienzoMes);
  const [hasta, setHasta] = useState(hoy);
  const [compararDesde, setCompararDesde] = useState("");
  const [compararHasta, setCompararHasta] = useState("");
  const [productoId, setProductoId] = useState(productoIdInicial ?? 0);
  const [varianteId, setVarianteId] = useState(0);
  const [proveedorId, setProveedorId] = useState(0);
  const [estado, setEstado] = useState<EstadoConsultaInforme>("vacio");
  const [resultado, setResultado] = useState<InformeComprasVentas | HistorialProducto | null>(null);
  const [comparacion, setComparacion] = useState<InformeComprasVentas | null>(null);
  const [error, setError] = useState("");

  async function consultar(evento?: FormEvent<HTMLFormElement>, pagina = 1) {
    evento?.preventDefault();
    if (desde > hasta || Boolean(compararDesde) !== Boolean(compararHasta)
      || (compararDesde && compararDesde > compararHasta)) {
      setEstado("error"); setError("Revisá las fechas del período y la comparación."); return;
    }
    setEstado("cargando"); setError("");
    const filtros: FiltrosInforme = { desde, hasta, pagina, limite: 20,
      ...(productoId ? { productoId } : {}), ...(varianteId ? { varianteId } : {}),
      ...(proveedorId ? { proveedorId } : {}) };
    const ruta = (valores: FiltrosInforme) => {
      const parametros = new URLSearchParams(Object.entries(valores).map(([clave, valor]) => [clave, String(valor)]));
      return productoId ? `/productos/${productoId}/historial?${parametros}` : `/informes/compras-ventas?${parametros}`;
    };
    try {
      const [principal, segunda] = await Promise.all([
        apiFetchAdmin<InformeComprasVentas | HistorialProducto>(ruta(filtros)),
        compararDesde ? apiFetchAdmin<InformeComprasVentas>(ruta({ ...filtros,
          desde: compararDesde, hasta: compararHasta, pagina: 1 })) : Promise.resolve(null),
      ]);
      setResultado(principal); setComparacion(segunda);
      setEstado(principal.totalResultados === 0 && !segunda ? "vacio" : "listo");
    } catch (causa) {
      setEstado(causa instanceof ApiError && [401, 403].includes(causa.status) ? "denegado" : "error");
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar el informe. Reintentá con los mismos filtros.");
    }
  }

  return <section id="informes" className="border border-black bg-white p-5" aria-label="Historial e informes">
    <h2 className="font-epilogue text-xl font-black uppercase">Historial e informes</h2>
    <p className="mt-2 text-sm">Hechos realizados por fecha propia. Los precios publicados se muestran separados de los importes efectivamente vendidos.</p>
    <form onSubmit={(evento) => void consultar(evento)} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} required className="mt-1 block w-full border border-black p-2" /></label>
      <label className="text-sm">Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} required className="mt-1 block w-full border border-black p-2" /></label>
      <label className="text-sm">Producto
        <select value={productoId || ""} onChange={(e) => { setProductoId(Number(e.target.value)); setVarianteId(0); }} className="mt-1 block w-full border border-black p-2">
          <option value="">Todos</option>{productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
        </select>
      </label>
      <label className="text-sm">Variante
        <select value={varianteId || ""} onChange={(e) => setVarianteId(Number(e.target.value))} className="mt-1 block w-full border border-black p-2">
          <option value="">Todas</option>{variantes.map((variante) => <option key={variante.id} value={variante.id}>{variante.nombre}</option>)}
        </select>
      </label>
      <label className="text-sm">Proveedor
        <select value={proveedorId || ""} onChange={(e) => setProveedorId(Number(e.target.value))} className="mt-1 block w-full border border-black p-2">
          <option value="">Todos</option>{proveedores.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Comparar desde<input type="date" value={compararDesde} onChange={(e) => setCompararDesde(e.target.value)} className="mt-1 block w-full border border-black p-2" /></label>
        <label className="text-sm">Comparar hasta<input type="date" value={compararHasta} onChange={(e) => setCompararHasta(e.target.value)} className="mt-1 block w-full border border-black p-2" /></label>
      </div>
      <button disabled={estado === "cargando"} className="w-fit bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Consultar</button>
    </form>
    {estado === "cargando" && <p role="status" className="mt-4">Cargando informe…</p>}
    {estado === "denegado" && <p role="alert" className="mt-4 text-red-700">Acceso denegado. {error}</p>}
    {estado === "error" && <div role="alert" className="mt-4 text-red-700"><p>{error}</p><button type="button" onClick={() => void consultar()} className="underline">Reintentar</button></div>}
    {estado === "vacio" && resultado && <p role="status" className="mt-4">No hay hechos para esos filtros. Los precios publicados pueden tener vigencias en el período.</p>}
    {(estado === "listo" || (estado === "vacio" && resultado)) && resultado && <div className="mt-5 space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">{resumenVisible(resultado, "Período principal")}{comparacion && resumenVisible(comparacion, "Comparación")}</div>
      {"precios" in resultado && <div className="border border-neutral-300 p-4 text-sm">
        <h3 className="font-bold">Precios publicados · {resultado.producto.nombre}</h3>
        <p>Stock físico actual: {resultado.producto.stockFisicoActual}. {resultado.promocionEnPeriodo ? "Hubo una promoción registrada en el período." : "Sin promoción registrada en el período."}</p>
        {resultado.precios.length === 0 ? <p>No hay vigencias registradas para esas fechas.</p> : <ul className="mt-2 space-y-1">
          {resultado.precios.map((precio, indice) => <li key={`${precio.clase}-${precio.inicio}-${indice}`}>{precio.clase} · {moneda.format(Number(precio.importe))} · {new Date(precio.inicio).toLocaleDateString("es-AR")} a {precio.fin ? new Date(precio.fin).toLocaleDateString("es-AR") : "actual"}</li>)}
        </ul>}
      </div>}
      <h3 className="font-bold">Detalle de hechos</h3>
      <ul className="divide-y border-y text-sm">{resultado.datos.map((dato) => <li key={dato.id} className="py-2">
        {mostrarFecha(dato.fecha)} · {dato.tipo.replaceAll("_", " ")}
        {dato.cantidad !== undefined ? ` · ${dato.cantidad} unidades` : ""}
        {dato.importeVentaAtribuido ? ` · venta ${moneda.format(Number(dato.importeVentaAtribuido))}` : ""}
        {dato.compras ? ` · compra ${moneda.format(Number(dato.compras))}` : ""}
        {dato.importeReintegrado ? ` · reintegro ${moneda.format(Number(dato.importeReintegrado))}` : ""}
        {dato.costoDesconocido ? " · costo desconocido" : ""}
      </li>)}</ul>
      {resultado.paginas > 1 && <div className="flex gap-4 text-sm">
        <button type="button" disabled={resultado.pagina <= 1} onClick={() => void consultar(undefined, resultado.pagina - 1)} className="underline disabled:opacity-40">Anterior</button>
        <span>Página {resultado.pagina} de {resultado.paginas}</span>
        <button type="button" disabled={resultado.pagina >= resultado.paginas} onClick={() => void consultar(undefined, resultado.pagina + 1)} className="underline disabled:opacity-40">Siguiente</button>
      </div>}
    </div>}
  </section>;
}
