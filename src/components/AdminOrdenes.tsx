"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import type { OrdenAdmin, PaginaOrdenesAdmin } from "@/types/orden";
import { tituloEstadoOrden } from "@/lib/estado-orden";
import { useConfirmacion } from "@/components/useConfirmacion";
import { MEDIOS_PAGO_LOCAL, etiquetaMedioPago } from "@/lib/venta-local";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString("es-AR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires",
}) : "No disponible";
const mediosPago = [{ valor: "manual", etiqueta: etiquetaMedioPago("manual") }, ...MEDIOS_PAGO_LOCAL];
const ESTADOS = ["pendiente_pago", "pago_confirmado", "en_preparacion", "lista_para_retiro", "enviada", "entregada",
  "cancelada_cliente", "cancelada_admin", "cancelada_vencimiento"];
/** Atajos de los estados que piden trabajo; el resto queda en el selector. */
const ATAJOS = [
  { valor: "", etiqueta: "Todas" },
  { valor: "pendiente_pago", etiqueta: "Pago pendiente" },
  { valor: "pago_confirmado", etiqueta: "Por preparar" },
  { valor: "en_preparacion", etiqueta: "En preparación" },
  { valor: "lista_para_retiro", etiqueta: "Esperan retiro" },
  { valor: "enviada", etiqueta: "En camino" },
];

function parametrosOrdenes(numero: number, filtros: Record<string, string>) {
  const parametros = new URLSearchParams({ pagina: String(numero), limite: "20" });
  for (const [clave, valor] of Object.entries(filtros)) if (valor) parametros.set(clave, valor);
  return parametros;
}

function titular(orden: OrdenAdmin) {
  return orden.cliente ? `${orden.cliente.nombre} ${orden.cliente.apellido}`
    : `Venta en local · comprobante n.º ${orden.numeroComprobante ?? "-"}`;
}

const entrega = (tipo: string) => tipo === "retiro" ? "Retiro en el local" : tipo === "envio" ? "Envío a domicilio" : "Venta en el local";

/** Color + texto: el estado nunca depende solo del color. */
function EstadoOrden({ estado }: { estado: string }) {
  const estilo = estado === "pendiente_pago" || estado === "reserva_vencida_en_proceso" ? "border-amber-700 bg-amber-50 text-amber-900"
    : estado === "pago_confirmado" || estado === "en_preparacion" ? "border-black bg-black text-white"
      : estado === "entregada" ? "border-green-800 bg-green-50 text-green-900"
        : estado.startsWith("cancelada") ? "border-neutral-400 bg-neutral-100 text-neutral-600"
          : "border-black bg-white text-black";
  return <span className={`inline-block border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${estilo}`}>{tituloEstadoOrden(estado)}</span>;
}

function Bloque({ titulo, children, className = "" }: { titulo: string; children: ReactNode; className?: string }) {
  return <section className={`border border-neutral-300 p-4 ${className}`}>
    <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">{titulo}</h3>
    <div className="mt-2 space-y-1 text-sm">{children}</div>
  </section>;
}

export default function AdminOrdenes({ estadoInicial = "" }: { estadoInicial?: string }) {
  const [pagina, setPagina] = useState<PaginaOrdenesAdmin | null>(null);
  const [detalle, setDetalle] = useState<OrdenAdmin | null>(null);
  const [abriendo, setAbriendo] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState(estadoInicial);
  const [filtroEntrega, setFiltroEntrega] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [filtroMedio, setFiltroMedio] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoReintegroEnvio, setMotivoReintegroEnvio] = useState("");
  const [restituirStock, setRestituirStock] = useState("");
  const [envioCoordinado, setEnvioCoordinado] = useState(false);
  const [lineaDevolucionId, setLineaDevolucionId] = useState(0);
  const [cantidadDevolucion, setCantidadDevolucion] = useState(1);
  const [motivoDevolucion, setMotivoDevolucion] = useState("");
  const [claveDevolucion, setClaveDevolucion] = useState("");
  const [devolucionId, setDevolucionId] = useState(0);
  const [gestionDevolucion, setGestionDevolucion] = useState<"reintegros" | "cierre-sin-reintegro" | "recepciones">("reintegros");
  const [importeReintegro, setImporteReintegro] = useState("");
  const [constanciaProducto, setConstanciaProducto] = useState("");
  const [constanciaExaminada, setConstanciaExaminada] = useState(false);
  const [cantidadApta, setCantidadApta] = useState(0);
  const [cantidadDanada, setCantidadDanada] = useState(0);
  const [motivoGestion, setMotivoGestion] = useState("");
  const [claveGestion, setClaveGestion] = useState("");
  const [mensajeDevolucion, setMensajeDevolucion] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState("");
  const detalleRef = useRef<HTMLElement>(null);
  const filaRef = useRef<HTMLLIElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const { confirmar, dialogo } = useConfirmacion();
  const tituloDetalleRef = useRef<HTMLHeadingElement>(null);
  const posicionListaRef = useRef(0);

  useEffect(() => {
    if (!detalle?.id) return;
    tituloDetalleRef.current?.scrollIntoView({ block: "start" });
    tituloDetalleRef.current?.focus({ preventScroll: true });
  }, [detalle?.id]);

  function volver() {
    setDetalle(null);
    window.setTimeout(() => window.scrollTo({ top: posicionListaRef.current }), 0);
  }

  const filtros = { estado: filtroEstado, tipoEntrega: filtroEntrega, canal: filtroCanal, metodoPago: filtroMedio };
  const hayFiltros = Object.values(filtros).some(Boolean);

  async function cargar(numero = 1) {
    setCargando(true);
    setError("");
    try {
      setPagina(await apiFetchAdmin<PaginaOrdenesAdmin>(`/ordenes?${parametrosOrdenes(numero, filtros)}`));
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar las órdenes. Reintentá.");
    } finally {
      setCargando(false);
    }
  }

  function abrir(id: number) {
    // Un segundo clic sobre la misma orden la cierra.
    if (detalle?.id === id) { setDetalle(null); return; }
    setMensajeAccion("");
    void cargarDetalle(id);
  }

  async function cargarDetalle(id: number) {
    setError(""); setAbriendo(id);
    try {
      setDetalle(await apiFetchAdmin<OrdenAdmin>(`/ordenes/${id}`));
      setMotivo("");
      setRestituirStock("");
      setEnvioCoordinado(false);
      setLineaDevolucionId(0); setDevolucionId(0);
      setClaveDevolucion(""); setClaveGestion(""); setMensajeDevolucion("");
      setConstanciaProducto(""); setConstanciaExaminada(false);
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar el detalle. Reintentá.");
    } finally {
      setAbriendo(null);
    }
  }

  async function enviarDevolucion(ruta: string, body: object, clave: string, alCompletar: () => void) {
    if (!detalle || ocupado) return;
    setOcupado(true); setError(""); setMensajeDevolucion("");
    try {
      await apiFetchAdmin(`/ordenes/${detalle.id}/${ruta}`, { method: "POST", body: JSON.stringify({ ...body, claveOperacion: clave }) });
      const actual = await apiFetchAdmin<OrdenAdmin>(`/ordenes/${detalle.id}`);
      setDetalle(actual);
      setMensajeDevolucion("Operación registrada. Revisá el estado, los pagos y las recepciones.");
      alCompletar();
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos confirmar la operación. Consultá el estado y reintentá con la misma clave.");
    } finally { setOcupado(false); }
  }

  async function accion(ruta: string, metodo: "POST" | "PATCH", body: object, exito = "Cambios guardados.") {
    if (!detalle || ocupado) return;
    setOcupado(true);
    setError(""); setMensajeAccion("");
    try {
      const actual = await apiFetchAdmin<OrdenAdmin>(`/ordenes/${detalle.id}/${ruta}`, {
        method: metodo, body: JSON.stringify(body),
      });
      try {
        setDetalle(await apiFetchAdmin<OrdenAdmin>(`/ordenes/${detalle.id}`));
      } catch {
        setDetalle(actual);
      }
      setMensajeAccion(exito);
      await cargar(pagina?.pagina ?? 1);
    } catch (causa) {
      const mensaje = causa instanceof ApiError ? causa.message : "No pudimos completar la acción. Consultá el estado y reintentá.";
      await cargarDetalle(detalle.id);
      await cargar(pagina?.pagina ?? 1);
      setError(mensaje);
    } finally {
      setOcupado(false);
    }
  }

  // Los filtros se aplican al cambiarlos; también hace la primera carga (con el estado de la URL).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetalle(null);
    void cargar(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroEntrega, filtroCanal, filtroMedio]);

  const detalleId = detalle?.id;
  const pendienteAbierta = detalle?.estado === "pendiente_pago";
  const paginaActual = pagina?.pagina ?? 1;
  const hayPendientes = Boolean(pagina?.ordenes.some((orden) => orden.estado === "pendiente_pago"));

  useEffect(() => {
    if (!pendienteAbierta && !hayPendientes) return;
    const temporizador = window.setInterval(() => {
      if (!navigator.onLine) return;
      const parametros = parametrosOrdenes(paginaActual, {
        estado: filtroEstado, tipoEntrega: filtroEntrega, canal: filtroCanal, metodoPago: filtroMedio,
      });
      apiFetchAdmin<PaginaOrdenesAdmin>(`/ordenes?${parametros}`)
        .then(setPagina)
        .catch(() => setError("No pudimos actualizar la lista. Reintentá."));
      if (pendienteAbierta && detalleId) {
        apiFetchAdmin<OrdenAdmin>(`/ordenes/${detalleId}`)
          .then(setDetalle)
          .catch(() => setError("No pudimos actualizar el estado de la orden. Reintentá."));
      }
    }, 60_000);
    return () => window.clearInterval(temporizador);
  }, [detalleId, pendienteAbierta, paginaActual, hayPendientes, filtroEstado, filtroEntrega, filtroCanal, filtroMedio]);

  // Al abrir una orden, llevar la vista a su detalle y el foco a su título.
  useEffect(() => {
    if (!detalleId) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Se desplaza a la fila (no solo al detalle) para que se vea qué orden se abrió y su botón «Ocultar».
    (filaRef.current ?? detalleRef.current)?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
    tituloRef.current?.focus({ preventScroll: true });
  }, [detalleId]);

  function limpiarFiltros() {
    setFiltroEstado(""); setFiltroEntrega(""); setFiltroCanal(""); setFiltroMedio("");
  }

  const pendiente = detalle?.estado === "pendiente_pago" && detalle.estadoVisible === "pendiente_pago";
  const pagada = detalle && ["pago_confirmado", "en_preparacion", "lista_para_retiro", "enviada"].includes(detalle.estado);
  const siguientes = detalle?.estado === "pago_confirmado" ? ["en_preparacion"]
    : detalle?.estado === "en_preparacion" ? [detalle.tipoEntrega === "retiro" ? "lista_para_retiro" : "enviada"]
      : detalle?.estado === "lista_para_retiro" || detalle?.estado === "enviada" ? ["entregada"] : [];
  const puedeCancelar = Boolean(pendiente || (pagada && detalle?.estado !== "enviada"));

  function proximoPaso(orden: OrdenAdmin): string {
    if (orden.estadoVisible === "reserva_vencida_en_proceso") return "La reserva venció. El sistema la cancela en breve; no hace falta hacer nada.";
    if (pendiente) return orden.metodoPago === "mercado_pago"
      ? "Esperando el pago online: se confirma solo cuando el proveedor lo acredita."
      : "Esperando el pago. Confirmalo cuando verifiques la transferencia o el cobro.";
    if (orden.estado === "pago_confirmado") return "Pagada. Empezá a preparar los productos.";
    if (orden.estado === "en_preparacion") return orden.tipoEntrega === "retiro"
      ? "Cuando esté armada, marcala lista para que el cliente la retire."
      : "Cuando la despaches, marcala como enviada.";
    if (orden.estado === "lista_para_retiro") return "Esperando que el cliente la retire. Marcala entregada cuando la retire.";
    if (orden.estado === "enviada") return "En camino. Marcala entregada cuando llegue a destino.";
    if (orden.estado === "entregada") return "Orden completada. Desde acá podés gestionar devoluciones si hace falta.";
    return "Orden cancelada. No requiere acciones.";
  }

  function panelDetalle(orden: OrdenAdmin) {
    return <article ref={detalleRef} aria-labelledby="orden-admin-detalle" className="scroll-mt-24 border-x-2 border-b-2 border-black bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="orden-admin-detalle" ref={tituloRef} tabIndex={-1} className="font-epilogue text-2xl font-black uppercase outline-none">Orden #{orden.id}</h2>
          <p className="mt-1 text-sm text-neutral-600">Creada el {fecha(orden.creadaEn)}</p>
        </div>
        <div className="flex items-center gap-3">
          <EstadoOrden estado={orden.estadoVisible} />
          <button type="button" onClick={() => setDetalle(null)} aria-label="Cerrar detalle" className="border border-black p-1.5 hover:bg-neutral-100"><X className="h-4 w-4" aria-hidden /></button>
        </div>
      </div>

      {/* Próximo paso: lo primero que se lee y la acción principal. */}
      <section aria-label="Próximo paso" className="mt-5 border-l-4 border-black bg-neutral-100 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">Próximo paso</p>
        <p className="mt-1 font-semibold">{proximoPaso(orden)}</p>
        {pendiente && orden.metodoPago !== "mercado_pago" && <button type="button" disabled={ocupado}
          onClick={async () => { if (await confirmar(`¿Confirmar el pago de la orden #${orden.id} por ${moneda.format(Number(orden.subtotalProductos))}?`, { accion: "Confirmar pago" })) void accion("pago", "POST", {}, "Pago confirmado."); }}
          className="mt-3 bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Confirmar pago ({moneda.format(Number(orden.subtotalProductos))})</button>}
        {siguientes.map((estado) => <div key={estado} className="mt-3">
          {estado === "enviada" && !orden.esDemostracion && <label className="mb-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" checked={envioCoordinado} onChange={(event) => setEnvioCoordinado(event.target.checked)} /> Confirmo que el costo y el cobro del envío se coordinaron con el cliente.</label>}
          <button type="button" disabled={ocupado || (estado === "enviada" && (orden.esDemostracion ? !orden.domicilioRevisado : !envioCoordinado))}
            onClick={async () => {
              if (await confirmar(`¿Pasar la orden #${orden.id} a «${tituloEstadoOrden(estado)}»? No se puede volver atrás.`, { accion: "Cambiar estado" }))
                void accion("estado", "PATCH", { estado, ...(estado === "enviada" && !orden.esDemostracion ? { envioCoordinado: true } : {}) }, `La orden pasó a «${tituloEstadoOrden(estado)}».`);
            }}
            className="bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
            {ocupado ? "Guardando…" : `${orden.esDemostracion ? "Simular" : "Marcar como"} «${tituloEstadoOrden(estado)}»`}
          </button>
          {estado === "enviada" && orden.esDemostracion && !orden.domicilioRevisado && <p className="mt-2 text-xs text-neutral-600">Primero registrá la revisión del domicilio (más abajo).</p>}
        </div>)}
        {mensajeAccion && <p role="status" className="mt-3 text-sm font-semibold text-green-800">✓ {mensajeAccion}</p>}
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Bloque titulo="Cliente">
          {orden.cliente
            ? <><p className="font-semibold">{orden.cliente.nombre} {orden.cliente.apellido}</p><p>{orden.cliente.email}</p></>
            : <><p className="font-semibold">Venta en el local · comprobante n.º {orden.numeroComprobante}</p>
              {orden.nombreCliente && <p>{orden.nombreCliente}</p>}{orden.telefonoCliente && <p>{orden.telefonoCliente}</p>}</>}
          <p className="text-neutral-600">Canal {orden.canal === "local" ? "local" : "web"} · {etiquetaMedioPago(orden.metodoPago)}</p>
        </Bloque>
        <Bloque titulo="Entrega">
          <p className="font-semibold">{entrega(orden.tipoEntrega)}</p>
          {orden.canal === "local" ? <p>Entregada en el local: {fecha(orden.pagoConfirmadoEn)}</p>
            : pendiente && <p>Reserva hasta: {fecha(orden.venceEn)}</p>}
          {orden.tipoEntrega === "envio" && (orden.datosEnvio ? <>
            <p>{orden.datosEnvio.direccion}, {orden.datosEnvio.ciudad} ({orden.datosEnvio.codPostal})</p>
            <p>Tel. {orden.datosEnvio.telefono} · {orden.datosEnvio.email}</p>
          </> : <p>No hay datos de envío registrados.</p>)}
          {orden.envioCoordinado && <p className="text-neutral-600">Envío coordinado el {fecha(orden.envioCoordinadoEn)} (usuario #{orden.envioCoordinadoPorId}).</p>}
        </Bloque>
      </div>

      {(orden.canceladaEn || orden.motivoCancelacion) && <p className="mt-4 border border-neutral-400 bg-neutral-50 p-3 text-sm">
        Cancelada el {fecha(orden.canceladaEn)}{orden.motivoCancelacion ? ` · Motivo: ${orden.motivoCancelacion}` : ""}
        {orden.restituirStock !== null && ` · Stock restituido: ${orden.restituirStock ? "sí" : "no"}`}
      </p>}
      {orden.devolucion === "pendiente_de_gestionar" && !orden.devolucionesCliente?.length && <p className="mt-4 border-l-4 border-amber-700 bg-amber-50 p-3 text-sm font-semibold">Devolución pendiente de gestionar: todavía no se registró reembolso.</p>}

      <section className="mt-5" aria-label="Productos">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">Productos</h3>
        <div className="mt-2 divide-y divide-neutral-200 border-y border-black text-sm">
          {orden.detalles.map((linea) => <p key={linea.posicion} className="flex justify-between gap-3 py-2.5">
            <span>{linea.nombreProducto}{linea.talle && <span className="text-neutral-600"> · {linea.talle} / {linea.color}</span>} <strong>× {linea.cantidad}</strong></span>
            <span>{moneda.format(Number(linea.importeLinea))}</span>
          </p>)}
        </div>
        <div className="mt-3 space-y-1 text-right text-sm">
          <p>Subtotal de productos: <strong>{moneda.format(Number(orden.subtotalProductos))}</strong></p>
          {orden.estadoCostoEnvio === "sin_cotizar" ? <p>Envío: a coordinar · total final pendiente</p>
            : orden.estadoCostoEnvio === "cotizado" ? <p>Envío: {moneda.format(Number(orden.costoEnvio))} · <strong>Total {moneda.format(Number(orden.totalFinal))}</strong></p>
              : orden.estadoCostoEnvio === "no_aplica" ? <p className="text-base"><strong>Total {moneda.format(Number(orden.totalFinal))}</strong></p>
                : <p>Importes heredados: total registrado {orden.totalFinal ?? "no disponible"}.</p>}
        </div>
      </section>

      {orden.costoMercaderia && orden.costoMercaderia.estado !== "sin_pago" && <details className="mt-5 border border-neutral-300 p-4 text-sm">
        <summary className="cursor-pointer font-bold">Costo y margen de mercadería
          {orden.costoMercaderia.margenBruto !== null && orden.costoMercaderia.margenBruto !== undefined && <span className="font-normal text-neutral-600"> · margen {moneda.format(Number(orden.costoMercaderia.margenBruto))}</span>}
        </summary>
        {orden.costoMercaderia.estado === "sin_fifo" ? <p className="mt-2">Esta orden no tiene origen FIFO registrado; su margen no está determinado.</p> : <>
          <p className="mt-2">Importe atribuido: {moneda.format(Number(orden.costoMercaderia.importeAtribuido))}. Costo conocido: {moneda.format(Number(orden.costoMercaderia.costoConocido))}.</p>
          {orden.costoMercaderia.margenBruto === null
            ? <p className="mt-2 text-amber-800">Margen no determinado: {orden.costoMercaderia.unidadesSinCosto ? `${orden.costoMercaderia.unidadesSinCosto} unidad(es) sin costo conocido` : "hay unidades sin asignación FIFO completa"}.</p>
            : <p className="mt-2 font-semibold">Margen bruto de mercadería: {moneda.format(Number(orden.costoMercaderia.margenBruto))}</p>}
          <ul className="mt-2 space-y-1">
            {orden.costoMercaderia.origenes.map((origen, indice) => <li key={`${origen.partidaId}-${indice}`}>
              Partida #{origen.partidaId} · {origen.proveedorNombre ?? origen.origen} · {origen.cantidad} unidad(es) · importe {origen.importeEfectivo === null ? "no disponible" : moneda.format(Number(origen.importeEfectivo))} · costo {origen.costoConocido === null ? "desconocido" : moneda.format(Number(origen.costoConocido))}
            </li>)}
          </ul>
        </>}
      </details>}

      {orden.esDemostracion && <section aria-label="Pagos y reintegros simulados" className="mt-5 border border-amber-700 p-4 text-sm">
        <p className="font-bold">Demostración: pagos, envíos y reintegros sin dinero ni mercadería reales</p>
        <p className="mt-2">Pago: {orden.estadoPago ?? "sin iniciar"}. Envío: {moneda.format(Number(orden.costoEnvio ?? 0))}. Total: {moneda.format(Number(orden.totalFinal ?? 0))}.</p>
        <p>Saldo de reintegros simulados: {moneda.format(Number(orden.saldoMonetarioPendiente ?? 0))}</p>
        {orden.intentosPago?.map((i) => <p key={i.id} className="mt-2">Intento #{i.id}: {i.estado} · {moneda.format(Number(i.importe))} · {fecha(i.creadoEn)}{i.referenciaExterna ? ` · ${i.referenciaExterna}` : ""}</p>)}
        {orden.incidenciasPago?.map((i) => <div key={i.id} className="mt-2"><p>Incidencia #{i.id}: {i.tipo.replaceAll("_", " ")} · {i.estado}</p>
          <p>Importe: {i.importe === null ? "sin determinar" : moneda.format(Number(i.importe))} · Detectada: {fecha(i.detectadaEn)}</p>
          {i.resolucion && <p>Resolución: {i.resolucion} · actor #{i.actorUsuarioId ?? "?"} · {fecha(i.resueltaEn)}</p>}
          {i.estado === "abierta" && <button type="button" disabled={ocupado} className="mt-1 underline"
            onClick={async () => { if (await confirmar("¿Revisaste en el entorno de prueba que no existe un cobro pendiente de resolver?", { accion: "Registrar revisión simulada" }))
              void accion(`incidencias/${i.id}/resolucion`, "POST", { motivo: "Revisión administrativa de la simulación sin cobro pendiente", constancia: `SIM-revision-${i.id}` }); }}>Registrar revisión de incidencia simulada</button>}
        </div>)}
        {orden.tipoEntrega === "envio" && orden.pagoConfirmadoEn && !orden.domicilioRevisado && <button type="button" disabled={ocupado}
          className="mt-3 border border-black px-3 py-2" onClick={async () => {
            if (await confirmar("¿Revisaste calle, altura y pertenencia a Córdoba Capital?", { accion: "Registrar revisión" }))
              void accion("revision-domicilio", "POST", {});
          }}>Registrar revisión del domicilio</button>}
        {orden.domicilioRevisado && <p className="mt-2">Domicilio revisado: {fecha(orden.domicilioRevisadoEn ?? null)}</p>}
        {!!Number(orden.costoEnvio) && orden.pagoConfirmadoEn && !orden.reintegrosPago?.some((r) => r.concepto === "envio") && <div className="mt-3">
          <label>Motivo de reintegro de envío<input value={motivoReintegroEnvio} onChange={(e) => setMotivoReintegroEnvio(e.target.value)} className="block w-full border border-black p-2" /></label>
          <button type="button" disabled={ocupado || motivoReintegroEnvio.trim().length < 5} className="mt-2 underline"
            onClick={() => void accion("reintegro-envio", "POST", { motivo: motivoReintegroEnvio.trim() })}>Registrar obligación de envío simulada</button>
        </div>}
        {orden.reintegrosPago?.map((r) => <div key={r.id} className="mt-3 border-t border-black pt-2">
          <p>Reintegro #{r.id} · {r.concepto} · {r.estado} · {moneda.format(Number(r.importeDebido))}</p>
          <p>Reintegrado: {moneda.format(Number(r.importeReintegrado))} · actor #{r.actorUsuarioId ?? "?"} · {r.motivo ?? "Sin motivo adicional"}</p>
          {r.comprobadoEn && <p>Resultado registrado: {fecha(r.comprobadoEn)} · {r.referenciaExterna}</p>}
          {(r.estado === "pendiente" || r.estado === "fallido") && <button type="button" disabled={ocupado} className="mt-2 underline"
            onClick={() => void accion(`reintegros-pago/${r.id}/inicio`, "POST", {})}>Iniciar reintegro simulado</button>}
          {r.estado === "en_proceso" && r.referenciaExterna && <div className="mt-2">
            <p>Constancia interna: {r.referenciaExterna}</p>
            <button type="button" disabled={ocupado} className="mr-3 underline"
              onClick={() => void accion(`reintegros-pago/${r.id}`, "POST", { referenciaExterna: r.referenciaExterna, resultado: "completado" })}>Registrar éxito simulado</button>
            <button type="button" disabled={ocupado} className="underline"
              onClick={() => void accion(`reintegros-pago/${r.id}`, "POST", { referenciaExterna: r.referenciaExterna, resultado: "fallido" })}>Registrar fallo simulado</button>
          </div>}
        </div>)}
      </section>}

      {orden.pagoConfirmadoEn && <details open={Boolean(orden.devolucionesCliente?.length)} className="mt-5 border border-neutral-300 p-4 text-sm" aria-label="Devoluciones de cliente">
        <summary className="cursor-pointer font-bold">Devoluciones y reintegros{orden.devolucionesCliente?.length ? ` (${orden.devolucionesCliente.length})` : ""}</summary>
        <p className="mt-2 text-neutral-600">Aceptar una devolución calcula el importe en el servidor y revierte el costo. El stock vendible solo aumenta al registrar unidades aptas recibidas.</p>
        {(["enviada", "entregada"].includes(orden.estado)) ? <><div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label>Línea de venta
            <select className="mt-1 block w-full border border-black p-2" value={lineaDevolucionId || ""} onChange={(e) => { setLineaDevolucionId(Number(e.target.value)); setClaveDevolucion(""); }}>
              <option value="">Seleccioná</option>
              {/* Las líneas de venta rápida no tienen inventario que devolver. */}
              {orden.detalles.filter((linea) => linea.talle !== "").map((linea) => <option key={linea.id} value={linea.id}>{linea.nombreProducto} · {linea.talle} · máximo {linea.cantidad}</option>)}
            </select>
          </label>
          <label>Unidades a aceptar
            <input type="number" min={1} max={orden.detalles.find((linea) => linea.id === lineaDevolucionId)?.cantidad ?? 1}
              value={cantidadDevolucion} onChange={(e) => { setCantidadDevolucion(Number(e.target.value)); setClaveDevolucion(""); }}
              className="mt-1 block w-full border border-black p-2" />
          </label>
        </div>
        <label className="mt-3 block">Motivo
          <textarea value={motivoDevolucion} onChange={(e) => { setMotivoDevolucion(e.target.value); setClaveDevolucion(""); }} maxLength={500} className="mt-1 block w-full border border-black p-2" />
        </label>
        <button type="button" disabled={ocupado || !lineaDevolucionId || cantidadDevolucion < 1 || !motivoDevolucion.trim()}
          onClick={async () => { const clave = claveDevolucion || crypto.randomUUID(); setClaveDevolucion(clave);
            if (await confirmar(`¿Aceptar ${cantidadDevolucion} unidad(es) de la orden #${orden.id}? El importe se calcula en el servidor.`, { accion: "Aceptar devolución" }))
              void enviarDevolucion("devoluciones", { lineas: [{ detalleOrdenId: lineaDevolucionId, cantidad: cantidadDevolucion }], motivo: motivoDevolucion.trim() }, clave,
                () => { setClaveDevolucion(""); setMotivoDevolucion(""); }); }}
          className="mt-3 border border-black px-4 py-2 font-bold disabled:opacity-40">Aceptar devolución</button></>
          : !orden.devolucionesCliente?.length && <p className="mt-2">Las devoluciones se aceptan cuando la orden fue enviada o entregada.</p>}

        {!!orden.devolucionesCliente?.length && <div className="mt-6 space-y-3">
          {orden.devolucionesCliente.map((devolucion) => <div key={devolucion.id} className="border border-neutral-400 p-3">
            <p><strong>Devolución #{devolucion.id}</strong> · {devolucion.cantidad} unidad(es) · {devolucion.estado}{devolucion.esCancelacionAnteriorSalida ? " · cancelación antes de salida" : ""}</p>
            <p>Debido {moneda.format(Number(devolucion.importeDebido))} · reintegrado {moneda.format(Number(devolucion.importeReintegradoAcumulado))} · saldo {moneda.format(Number(devolucion.saldoPendiente))}</p>
            <p>Recepciones: {devolucion.recepciones.map((recepcion) => `${recepcion.cantidadApta} apta(s), ${recepcion.cantidadDanada} dañada(s)`).join("; ") || "ninguna"}</p>
            {devolucion.pagos.map((pago) => <p key={pago.id}>Reintegro de producto: {moneda.format(Number(pago.importeEfectivo))} · {fecha(pago.fecha)} · actor #{pago.actorUsuarioId}{pago.referenciaExterna ? ` · ${pago.referenciaExterna}` : ""}</p>)}
          </div>)}
          <label className="block">Gestionar devolución
            <select className="mt-1 block w-full border border-black p-2" value={devolucionId || ""} onChange={(e) => { setDevolucionId(Number(e.target.value)); setGestionDevolucion("reintegros"); setClaveGestion(""); }}>
              <option value="">Seleccioná</option>
              {orden.devolucionesCliente.map((devolucion) => <option key={devolucion.id} value={devolucion.id}>#{devolucion.id} · {devolucion.estado}</option>)}
            </select>
          </label>
          <label className="block">Acción
            <select className="mt-1 block w-full border border-black p-2" value={gestionDevolucion} onChange={(e) => { setGestionDevolucion(e.target.value as typeof gestionDevolucion); setClaveGestion(""); }}>
              <option value="reintegros">Registrar reintegro</option><option value="cierre-sin-reintegro">Cerrar saldo sin reintegro</option>
              {!orden.devolucionesCliente.find((devolucion) => devolucion.id === devolucionId)?.esCancelacionAnteriorSalida && <option value="recepciones">Recibir unidades</option>}
            </select>
          </label>
          {gestionDevolucion === "reintegros" && <label className="block">Importe efectivo reintegrado
            <input type="text" inputMode="decimal" value={importeReintegro} onChange={(e) => { setImporteReintegro(e.target.value); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" />
          </label>}
          {gestionDevolucion === "reintegros" && orden.esDemostracion && <div className="mt-3">
            <label className="block">Constancia de reintegro simulado
              <input type="text" value={constanciaProducto} onChange={(e) => { setConstanciaProducto(e.target.value); setConstanciaExaminada(false); setClaveGestion(""); }}
                placeholder="SIM-..." className="mt-1 block w-full border border-black p-2" />
            </label>
            <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={constanciaExaminada}
              onChange={(e) => setConstanciaExaminada(e.target.checked)} />Examiné esta constancia de la simulación.</label>
          </div>}
          {gestionDevolucion === "recepciones" && <div className="grid gap-3 sm:grid-cols-2">
            <label>Unidades aptas<input type="number" min={0} value={cantidadApta} onChange={(e) => { setCantidadApta(Number(e.target.value)); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" /></label>
            <label>Unidades dañadas<input type="number" min={0} value={cantidadDanada} onChange={(e) => { setCantidadDanada(Number(e.target.value)); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" /></label>
          </div>}
          {gestionDevolucion !== "reintegros" && <label className="block">Motivo
            <textarea value={motivoGestion} onChange={(e) => { setMotivoGestion(e.target.value); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" />
          </label>}
          <button type="button" disabled={ocupado || !devolucionId || (gestionDevolucion === "reintegros" && (!importeReintegro
            || (orden.esDemostracion && (!/^SIM-[A-Za-z0-9_-]{4,100}$/.test(constanciaProducto) || !constanciaExaminada))))
            || (gestionDevolucion === "cierre-sin-reintegro" && !motivoGestion.trim())
            || (gestionDevolucion === "recepciones" && cantidadApta + cantidadDanada < 1)}
            onClick={async () => { const clave = claveGestion || crypto.randomUUID(); setClaveGestion(clave);
              if (await confirmar(`¿Registrar ${gestionDevolucion.replaceAll("-", " ")} para la devolución #${devolucionId}?`, { accion: "Registrar" }))
                void enviarDevolucion(`devoluciones/${devolucionId}/${gestionDevolucion}`,
                  gestionDevolucion === "reintegros" ? { importeEfectivo: importeReintegro,
                    ...(orden.esDemostracion ? { referenciaExterna: constanciaProducto, constanciaExaminada: true } : {}) }
                    : gestionDevolucion === "cierre-sin-reintegro" ? { motivo: motivoGestion.trim() }
                      : { cantidadApta, cantidadDanada, ...(motivoGestion.trim() ? { motivo: motivoGestion.trim() } : {}) },
                  clave, () => { setClaveGestion(""); setImporteReintegro(""); setConstanciaProducto("");
                    setConstanciaExaminada(false); setMotivoGestion(""); setCantidadApta(0); setCantidadDanada(0); }); }}
            className="border border-black px-4 py-2 font-bold disabled:opacity-40">Registrar acción</button>
        </div>}
        {mensajeDevolucion && <p role="status" className="mt-3">{mensajeDevolucion}</p>}
      </details>}

      <details className="mt-5 border border-neutral-300 p-4 text-sm">
        <summary className="cursor-pointer font-bold">Historial de estados ({orden.eventos.length})</summary>
        <ol className="mt-3 space-y-3">{orden.eventos.map((evento, indice) => <li key={`${evento.fecha}-${indice}`} className="border-l-2 border-black pl-3"><strong>{tituloEstadoOrden(evento.estadoNuevo)}</strong> · {fecha(evento.fecha)} · {evento.origen}{evento.actorUsuarioId ? ` · ${evento.actorNombre ?? "Usuario no disponible"}` : ""}{evento.motivo ? ` · ${evento.motivo}` : ""}{evento.restituirStock !== null ? ` · Restituir stock: ${evento.restituirStock ? "sí" : "no"}` : ""}</li>)}</ol>
      </details>

      {/* La cancelación queda plegada y separada para evitar errores. */}
      {puedeCancelar && <details className="mt-5 border border-red-700 p-4 text-sm">
        <summary className="cursor-pointer font-bold text-red-700">Cancelar orden…</summary>
        <label className="mt-3 block">Motivo (obligatorio)
          <textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} maxLength={500} className="mt-1 block min-h-20 w-full border border-black p-3" />
        </label>
        {pagada && <label className="mt-3 block">¿Restituir stock?
          <select value={restituirStock} onChange={(event) => setRestituirStock(event.target.value)} className="mt-1 block border border-black p-2"><option value="">Elegir</option><option value="si">Sí, los productos vuelven a estar disponibles</option><option value="no">No</option></select>
        </label>}
        <button type="button" disabled={ocupado || !motivo.trim() || Boolean(pagada && !restituirStock)}
          onClick={async () => { if (await confirmar(`¿Cancelar la orden #${orden.id}? Esta acción no se puede deshacer.`, { accion: "Cancelar orden", destructiva: true })) void accion("cancelacion", "POST", { motivo: motivo.trim(), ...(pagada ? { restituirStock: restituirStock === "si" } : {}) }, "Orden cancelada."); }}
          className="mt-4 border border-red-700 px-4 py-2 font-bold text-red-700 disabled:opacity-40">Cancelar orden</button>
      </details>}
    </article>;
  }

  const selectClass = "mt-1 block border border-black bg-white p-2 text-sm";

  return <section className="space-y-5">
    <div className="space-y-4 border-y border-black py-5">
      <div role="group" aria-label="Estado rápido" className="flex flex-wrap gap-2">
        {ATAJOS.map(({ valor, etiqueta }) => <button key={valor || "todas"} type="button" aria-pressed={filtroEstado === valor}
          onClick={() => setFiltroEstado(valor)}
          className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${filtroEstado === valor ? "border-black bg-black text-white" : "border-black bg-white hover:bg-neutral-100"}`}>{etiqueta}</button>)}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-semibold">Estado
          <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {ESTADOS.map((valor) => <option key={valor} value={valor}>{tituloEstadoOrden(valor)}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Entrega
          <select value={filtroEntrega} onChange={(event) => setFiltroEntrega(event.target.value)} className={selectClass}>
            <option value="">Todas</option><option value="retiro">Retiro</option><option value="envio">Envío</option><option value="local">En el local</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Canal
          <select value={filtroCanal} onChange={(event) => setFiltroCanal(event.target.value)} className={selectClass}>
            <option value="">Todos</option><option value="web">Web</option><option value="local">Local</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Medio de pago
          <select value={filtroMedio} onChange={(event) => setFiltroMedio(event.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {mediosPago.map(({ valor, etiqueta }) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </label>
        {hayFiltros && <button type="button" onClick={limpiarFiltros} className="py-2 text-sm font-semibold underline">Limpiar filtros</button>}
        <button type="button" onClick={() => void cargar(pagina?.pagina ?? 1)} disabled={cargando} className="ml-auto border border-black bg-white px-4 py-2 text-sm font-bold hover:bg-neutral-100 disabled:opacity-40">{cargando ? "Actualizando…" : "Actualizar"}</button>
      </div>
      {pagina && <p className="text-sm text-neutral-600" aria-live="polite">{pagina.total} {pagina.total === 1 ? "orden" : "órdenes"}{hayFiltros ? " con estos filtros" : ""}.</p>}
    </div>

    {error && <div role="alert" className="border border-red-700 bg-white p-4 text-red-700"><p>{error}</p><button type="button" onClick={() => void cargar(pagina?.pagina ?? 1)} className="mt-2 underline">Reintentar</button></div>}
    {cargando && !pagina && <p role="status">Cargando órdenes…</p>}
    {pagina?.ordenes.length === 0 && !error && !cargando && <div className="border border-dashed border-neutral-400 bg-white p-6 text-center text-sm">
      <p>No hay órdenes {hayFiltros ? "con estos filtros" : "todavía"}.</p>
      {hayFiltros && <button type="button" onClick={limpiarFiltros} className="mt-2 font-semibold underline">Ver todas</button>}
    </div>}

    {!!pagina?.ordenes.length && <ul className={`space-y-2 ${cargando ? "opacity-60" : ""}`}>
      {pagina.ordenes.map((orden) => {
        const abierta = detalle?.id === orden.id;
        const total = orden.totalFinal ?? orden.subtotalProductos;
        return <li key={orden.id} ref={abierta ? filaRef : undefined} className="scroll-mt-24">
          <div className={`flex flex-wrap items-center justify-between gap-4 border-2 p-4 ${abierta ? "border-black bg-neutral-50" : "border-neutral-300 bg-white hover:border-black"}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong>#{orden.id} · {titular(orden)}</strong>
                <EstadoOrden estado={orden.estadoVisible} />
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {fecha(orden.creadaEn)} · {entrega(orden.tipoEntrega)} · {etiquetaMedioPago(orden.metodoPago)} · <span className="uppercase">{orden.canal}</span>
                {total && <> · <strong className="text-black">{moneda.format(Number(total))}</strong></>}
              </p>
            </div>
            <button type="button" onClick={() => abrir(orden.id)} aria-expanded={abierta} disabled={abriendo !== null}
              className={`flex items-center gap-2 border border-black px-4 py-2 text-sm font-bold disabled:opacity-60 ${abierta ? "bg-white" : "bg-black text-white"}`}>
              {abriendo === orden.id ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Abriendo…</>
                : abierta ? <>Ocultar <ChevronUp className="h-4 w-4" aria-hidden /></>
                  : <>Ver y gestionar <ChevronDown className="h-4 w-4" aria-hidden /></>}
            </button>
          </div>
          {abierta && detalle && panelDetalle(detalle)}
        </li>;
      })}
    </ul>}

    {/* Si la orden abierta no está en la página actual, el detalle se muestra igual. */}
    {detalle && !pagina?.ordenes.some((orden) => orden.id === detalle.id) && panelDetalle(detalle)}

    {pagina && pagina.paginas > 1 && <div className="flex items-center gap-4 text-sm"><button type="button" disabled={pagina.pagina <= 1} onClick={() => void cargar(pagina.pagina - 1)} className="underline disabled:opacity-40">Anterior</button><span>Página {pagina.pagina} de {pagina.paginas}</span><button type="button" disabled={pagina.pagina >= pagina.paginas} onClick={() => void cargar(pagina.pagina + 1)} className="underline disabled:opacity-40">Siguiente</button></div>}
    {dialogo}
  </section>;
}
