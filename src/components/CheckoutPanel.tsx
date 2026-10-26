"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetchInterna } from "@/lib/api";
import type { DatosEnvioCheckout, EntradaEntrega, ResumenCheckout, TipoEntrega } from "@/types/orden";
import { tituloEstadoOrden } from "@/lib/estado-orden";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fechaReserva = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const vacios: DatosEnvioCheckout = { direccion: "", ciudad: "", codPostal: "", telefono: "", email: "" };
const campos: { clave: keyof DatosEnvioCheckout; etiqueta: string; tipo?: string }[] = [
  { clave: "direccion", etiqueta: "Dirección" },
  { clave: "ciudad", etiqueta: "Ciudad" },
  { clave: "codPostal", etiqueta: "Código postal" },
  { clave: "telefono", etiqueta: "Teléfono", tipo: "tel" },
  { clave: "email", etiqueta: "Correo electrónico", tipo: "email" },
];

const motivoTexto: Record<string, string> = {
  cantidad_invalida: "La cantidad no es válida",
  producto_improvisado: "Este producto improvisado no participa del checkout web; corregilo en el carrito",
  producto_retirado: "El producto fue retirado",
  producto_no_publicado: "El producto no está publicado para la tienda web",
  drop_no_lanzado: "El drop todavía no se lanzó",
  variante_inactiva: "La variante ya no está activa",
  stock_insuficiente: "No hay stock disponible para la cantidad solicitada",
};

export default function CheckoutPanel() {
  const claveIntento = useRef<string | null>(null);
  const mensajeRef = useRef<HTMLParagraphElement>(null);
  const versionResumen = useRef(0);
  const hayResumen = useRef(false);
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retiro");
  const [datosEnvio, setDatosEnvio] = useState<DatosEnvioCheckout>(vacios);
  const [resumen, setResumen] = useState<ResumenCheckout | null>(null);
  const [resumenVigente, setResumenVigente] = useState(false);
  const [aceptaPrecio, setAceptaPrecio] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, string>>({});
  const [ordenCreada, setOrdenCreada] = useState<{ id: number; estado: string; venceEn: string } | null>(null);

  async function solicitarConLimite<T>(ruta: string, body: object, limiteMs = 10_000): Promise<T> {
    const control = new AbortController();
    const temporizador = window.setTimeout(() => control.abort(), limiteMs);
    try {
      return await apiFetchInterna<T>(ruta, {
        method: "POST", body: JSON.stringify(body), signal: control.signal,
      });
    } finally {
      window.clearTimeout(temporizador);
    }
  }

  function anunciarError(texto: string) {
    setMensaje(texto);
    window.setTimeout(() => mensajeRef.current?.focus(), 0);
  }

  async function consultarResumen(entrega: EntradaEntrega) {
    const version = ++versionResumen.current;
    setCargando(true);
    setResumenVigente(false);
    setMensaje("");
    setCamposInvalidos({});
    setAceptaPrecio(false);
    claveIntento.current = null;
    try {
      const nuevoResumen = await solicitarConLimite<ResumenCheckout>("/api/checkout/resumen", entrega);
      if (version !== versionResumen.current) return;
      setResumen(nuevoResumen);
      hayResumen.current = true;
      setResumenVigente(true);
      setMensaje("");
    } catch (error) {
      if (version !== versionResumen.current) return;
      if (error instanceof ApiError) {
        anunciarError(error.message);
        setCamposInvalidos(Object.fromEntries((error.camposInvalidos ?? [])
          .map((campo) => [campo.campo, campo.mensaje])));
      } else anunciarError("El resumen tardó demasiado o falló. Reintentá para obtener precios vigentes.");
    } finally {
      if (version === versionResumen.current) setCargando(false);
    }
  }

  useEffect(() => {
    const envioIncompleto = tipoEntrega === "envio" && Object.values(datosEnvio).some((valor) => !valor.trim());
    if (envioIncompleto && hayResumen.current) return;
    const version = ++versionResumen.current;
    const control = new AbortController();
    let limite: number | undefined;
    const espera = window.setTimeout(() => {
      if (version !== versionResumen.current) return;
      setCargando(true);
      limite = window.setTimeout(() => control.abort(), 10_000);
      apiFetchInterna<ResumenCheckout>("/api/checkout/resumen", {
        method: "POST",
        body: JSON.stringify(envioIncompleto
          ? { tipoEntrega: "retiro", datosEnvio: null }
          : { tipoEntrega, datosEnvio: tipoEntrega === "envio" ? datosEnvio : null }),
        signal: control.signal,
      }).then((nuevoResumen) => {
        if (version !== versionResumen.current) return;
        setResumen(nuevoResumen);
        hayResumen.current = true;
        setResumenVigente(!envioIncompleto);
        setMensaje("");
        setCamposInvalidos({});
      }).catch((error) => {
        if (version !== versionResumen.current) return;
        setResumenVigente(false);
        setMensaje(error instanceof ApiError ? error.message : "El resumen tardó demasiado o falló. Reintentá.");
        if (error instanceof ApiError) setCamposInvalidos(Object.fromEntries((error.camposInvalidos ?? [])
          .map((campo) => [campo.campo, campo.mensaje])));
      }).finally(() => {
        if (limite !== undefined) window.clearTimeout(limite);
        if (version === versionResumen.current) setCargando(false);
      });
    }, tipoEntrega === "envio" ? 350 : 0);
    return () => {
      versionResumen.current += 1;
      window.clearTimeout(espera);
      if (limite !== undefined) window.clearTimeout(limite);
      control.abort();
    };
  }, [tipoEntrega, datosEnvio]);

  function entregaActual(): EntradaEntrega {
    return { tipoEntrega, datosEnvio: tipoEntrega === "envio" ? datosEnvio : null };
  }

  function cambiarEntrega(valor: TipoEntrega) {
    versionResumen.current += 1;
    setTipoEntrega(valor);
    setResumenVigente(false);
    setCargando(false);
    setAceptaPrecio(false);
    setMensaje("");
    claveIntento.current = null;
  }

  async function confirmar() {
    if (!resumen || !resumenVigente || !resumen.puedeConfirmar || !aceptaPrecio || enviando) return;
    setEnviando(true);
    setMensaje("");
    claveIntento.current ??= crypto.randomUUID();
    try {
      const orden = await solicitarConLimite<{ id: number; estado: string; venceEn: string }>(
        "/api/checkout/confirmacion", { ...entregaActual(), huellaResumen: resumen.huellaResumen,
          aceptaPrecioVigente: true, claveConfirmacion: claveIntento.current }, 20_000,
      );
      setOrdenCreada(orden);
      window.dispatchEvent(new Event("carrito-actualizado"));
    } catch (error) {
      if (error instanceof ApiError) {
        anunciarError(error.message);
        if (error.resumen) setResumen(error.resumen);
        if (error.codigo === "RESUMEN_CAMBIO" || error.codigo === "ITEMS_NO_DISPONIBLES") {
          setAceptaPrecio(false);
          claveIntento.current = null;
        }
        setCamposInvalidos(Object.fromEntries((error.camposInvalidos ?? [])
          .map((campo) => [campo.campo, campo.mensaje])));
      } else anunciarError("La confirmación tardó demasiado o falló. Reintentá con la misma solicitud.");
    } finally {
      setEnviando(false);
    }
  }

  if (ordenCreada) {
    return <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-epilogue text-3xl font-bold uppercase">Tu orden fue creada correctamente</h1>
      <p className="mt-4">Tu número de pedido es #{ordenCreada.id}.</p>
      <p className="mt-2">Estado: {tituloEstadoOrden(ordenCreada.estado)}. Reservamos tus productos hasta el {fechaReserva.format(new Date(ordenCreada.venceEn))}.</p>
      <Link href="/cuenta" className="mt-6 inline-block underline">Ver mis órdenes</Link>
    </section>;
  }

  return <section className="mx-auto max-w-4xl px-6 py-10">
    <h1 className="font-epilogue text-3xl font-bold uppercase">Revisar compra</h1>
    <p className="mt-2 text-sm text-gray-600">Los precios y la disponibilidad se verifican otra vez al confirmar.</p>
    <fieldset className="mt-8 border-t border-black pt-5">
      <legend className="font-bold uppercase">Entrega</legend>
      <div className="flex gap-6">
        <label className="flex items-center gap-2"><input type="radio" name="tipoEntrega" checked={tipoEntrega === "retiro"} onChange={() => cambiarEntrega("retiro")} /> Retiro</label>
        <label className="flex items-center gap-2"><input type="radio" name="tipoEntrega" checked={tipoEntrega === "envio"} onChange={() => cambiarEntrega("envio")} /> Envío</label>
      </div>
    </fieldset>

    {tipoEntrega === "envio" && <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {campos.map(({ clave, etiqueta, tipo }) => <label key={clave} className="block text-sm font-semibold">
        {etiqueta}
        <input type={tipo ?? "text"} value={datosEnvio[clave]} required
          aria-invalid={Boolean(camposInvalidos[clave])} aria-describedby={camposInvalidos[clave] ? `error-${clave}` : undefined}
          onChange={(event) => { versionResumen.current += 1; setDatosEnvio((actual) => ({ ...actual, [clave]: event.target.value })); setResumenVigente(false); setCargando(false); setAceptaPrecio(false); claveIntento.current = null; }}
          className="mt-1 block w-full border border-gray-500 p-3 focus:outline-2 focus:outline-black" />
        {camposInvalidos[clave] && <span id={`error-${clave}`} className="mt-1 block text-red-700">{camposInvalidos[clave]}</span>}
      </label>)}
    </div>}

    <button type="button" onClick={() => void consultarResumen(entregaActual())} disabled={cargando}
      className="mt-6 border border-black px-5 py-3 text-sm font-bold disabled:opacity-40">Actualizar resumen</button>

    {cargando && <p className="mt-6" role="status">Cargando resumen...</p>}
    {mensaje && <p ref={mensajeRef} tabIndex={-1} className="mt-6 text-red-700 outline-offset-2 focus:outline-2" role="alert">{mensaje}</p>}
    {resumen && <div className="mt-8 border-t-2 border-black pt-5">
      <h2 className="font-epilogue text-xl font-bold uppercase">Productos y precios</h2>
      {!resumenVigente && <p className="mt-3 text-amber-800" role="status">El resumen se está actualizando para esta entrega. Completá los datos de envío si corresponde; todavía no podés confirmar.</p>}
      <div className="mt-4 divide-y divide-gray-200">
        {resumen.lineas.map((linea) => <div key={linea.itemCarritoId} className="py-4">
          <div className="flex justify-between gap-4"><span>{linea.nombreProducto} · {linea.talle ?? "Sin talle"} / {linea.color ?? "Sin color"} × {linea.cantidad}</span><span>{linea.importeLinea === null ? "No disponible" : moneda.format(Number(linea.importeLinea))}</span></div>
          {linea.cambioPrecio && <p className="mt-1 text-amber-800">El precio cambió: en el carrito {moneda.format(Number(linea.precioCarrito))}; precio vigente {moneda.format(Number(linea.precioVigente))}.</p>}
          {linea.motivoBloqueo && <p className="mt-1 text-red-700" role="alert">No se puede confirmar este ítem: {(linea.motivosBloqueo?.length ? linea.motivosBloqueo : [linea.motivoBloqueo]).map((motivo) => motivoTexto[motivo] ?? motivo).join("; ")}.</p>}
        </div>)}
      </div>
      {!resumen.lineas.length && <p className="py-5">Tu carrito está vacío.</p>}
      <div className="border-t border-black pt-4">
        {resumen.lineas.some((linea) => linea.cambioPrecio) && <p className="mb-2 flex justify-between text-amber-800"><span>Subtotal anterior del carrito</span><span>{moneda.format(Number(resumen.subtotalCarrito))}</span></p>}
        <p className="flex justify-between"><span>Subtotal de productos</span><strong>{moneda.format(Number(resumen.subtotalProductos))}</strong></p>
        {tipoEntrega === "envio" ? <><p className="mt-2">Envío: costo a coordinar</p><p className="mt-2 font-semibold">Total final pendiente de coordinación.</p></>
          : <p className="mt-2 flex justify-between"><span>Total</span><strong>{moneda.format(Number(resumen.totalFinal))}</strong></p>}
      </div>
      <p className="mt-4 text-sm text-gray-700">Si confirmás, los productos quedarán reservados por un día (24 horas). La fecha de vencimiento aparecerá en la orden creada.</p>
      <label className="mt-6 flex items-start gap-2"><input type="checkbox" checked={aceptaPrecio} disabled={!resumenVigente} onChange={(event) => setAceptaPrecio(event.target.checked)} /> Acepto explícitamente los precios vigentes y el importe conocido de esta compra.</label>
      {!resumen.puedeConfirmar && <p className="mt-4 text-red-700">Corregí los ítems indicados en el carrito para continuar.</p>}
      <button type="button" onClick={() => void confirmar()} disabled={!resumenVigente || !resumen.puedeConfirmar || !aceptaPrecio || enviando}
        className="mt-6 w-full bg-black px-5 py-4 font-bold uppercase text-white disabled:opacity-40">{enviando ? "Confirmando..." : "Confirmar orden"}</button>
    </div>}
    <Link href="/carrito" className="mt-7 inline-block underline">Volver al carrito</Link>
  </section>;
}
