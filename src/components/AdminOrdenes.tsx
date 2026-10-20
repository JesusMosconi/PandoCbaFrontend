"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import type { OrdenAdmin, PaginaOrdenesAdmin } from "@/types/orden";
import { tituloEstadoOrden } from "@/lib/estado-orden";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString("es-AR") : "No disponible";

export default function AdminOrdenes() {
  const [pagina, setPagina] = useState<PaginaOrdenesAdmin | null>(null);
  const [detalle, setDetalle] = useState<OrdenAdmin | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroEntrega, setFiltroEntrega] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [restituirStock, setRestituirStock] = useState("");
  const [envioCoordinado, setEnvioCoordinado] = useState(false);
  const [lineaDevolucionId, setLineaDevolucionId] = useState(0);
  const [cantidadDevolucion, setCantidadDevolucion] = useState(1);
  const [motivoDevolucion, setMotivoDevolucion] = useState("");
  const [claveDevolucion, setClaveDevolucion] = useState("");
  const [devolucionId, setDevolucionId] = useState(0);
  const [gestionDevolucion, setGestionDevolucion] = useState<"reintegros" | "cierre-sin-reintegro" | "recepciones">("reintegros");
  const [importeReintegro, setImporteReintegro] = useState("");
  const [cantidadApta, setCantidadApta] = useState(0);
  const [cantidadDanada, setCantidadDanada] = useState(0);
  const [motivoGestion, setMotivoGestion] = useState("");
  const [claveGestion, setClaveGestion] = useState("");
  const [mensajeDevolucion, setMensajeDevolucion] = useState("");

  async function cargar(numero = 1) {
    setCargando(true);
    setError("");
    try {
      const parametros = new URLSearchParams({ pagina: String(numero), limite: "20" });
      if (filtroEstado) parametros.set("estado", filtroEstado);
      if (filtroEntrega) parametros.set("tipoEntrega", filtroEntrega);
      setPagina(await apiFetchAdmin<PaginaOrdenesAdmin>(`/ordenes?${parametros}`));
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar las órdenes. Reintentá.");
    } finally {
      setCargando(false);
    }
  }

  async function abrir(id: number) {
    setError("");
    try {
      setDetalle(await apiFetchAdmin<OrdenAdmin>(`/ordenes/${id}`));
      setMotivo("");
      setRestituirStock("");
      setEnvioCoordinado(false);
      setLineaDevolucionId(0); setDevolucionId(0);
      setClaveDevolucion(""); setClaveGestion(""); setMensajeDevolucion("");
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar el detalle. Reintentá.");
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

  async function accion(ruta: string, metodo: "POST" | "PATCH", body: object) {
    if (!detalle || ocupado) return;
    setOcupado(true);
    setError("");
    try {
      const actual = await apiFetchAdmin<OrdenAdmin>(`/ordenes/${detalle.id}/${ruta}`, {
        method: metodo, body: JSON.stringify(body),
      });
      try {
        setDetalle(await apiFetchAdmin<OrdenAdmin>(`/ordenes/${detalle.id}`));
      } catch {
        setDetalle(actual);
      }
      await cargar(pagina?.pagina ?? 1);
    } catch (causa) {
      const mensaje = causa instanceof ApiError ? causa.message : "No pudimos completar la acción. Consultá el estado y reintentá.";
      await abrir(detalle.id);
      await cargar(pagina?.pagina ?? 1);
      setError(mensaje);
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    apiFetchAdmin<PaginaOrdenesAdmin>("/ordenes?pagina=1&limite=20")
      .then(setPagina)
      .catch((causa) => setError(causa instanceof ApiError ? causa.message : "No pudimos cargar las órdenes. Reintentá."))
      .finally(() => setCargando(false));
  }, []);

  const detalleId = detalle?.id;
  const pendienteAbierta = detalle?.estado === "pendiente_pago";
  const paginaActual = pagina?.pagina ?? 1;
  const hayPendientes = Boolean(pagina?.ordenes.some((orden) => orden.estado === "pendiente_pago"));

  useEffect(() => {
    if (!pendienteAbierta && !hayPendientes) return;
    const temporizador = window.setInterval(() => {
      if (!navigator.onLine) return;
      const parametros = new URLSearchParams({ pagina: String(paginaActual), limite: "20" });
      if (filtroEstado) parametros.set("estado", filtroEstado);
      if (filtroEntrega) parametros.set("tipoEntrega", filtroEntrega);
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
  }, [detalleId, pendienteAbierta, paginaActual, hayPendientes, filtroEstado, filtroEntrega]);

  const pendiente = detalle?.estado === "pendiente_pago" && detalle.estadoVisible === "pendiente_pago";
  const pagada = detalle && ["pago_confirmado", "en_preparacion", "lista_para_retiro", "enviada"].includes(detalle.estado);
  const siguientes = detalle?.estado === "pago_confirmado" ? ["en_preparacion"]
    : detalle?.estado === "en_preparacion" ? [detalle.tipoEntrega === "retiro" ? "lista_para_retiro" : "enviada"]
      : detalle?.estado === "lista_para_retiro" || detalle?.estado === "enviada" ? ["entregada"] : [];

  return <section className="space-y-7">
    <div className="flex flex-wrap items-end gap-4 border-y border-black py-5">
      <label className="text-sm font-semibold">Estado
        <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)} className="mt-1 block border border-black p-2">
          <option value="">Todos</option>
          {["pendiente_pago", "pago_confirmado", "en_preparacion", "lista_para_retiro", "enviada", "entregada", "cancelada_cliente", "cancelada_admin", "cancelada_vencimiento"].map((valor) => <option key={valor} value={valor}>{valor.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Entrega
        <select value={filtroEntrega} onChange={(event) => setFiltroEntrega(event.target.value)} className="mt-1 block border border-black p-2">
          <option value="">Todas</option><option value="retiro">Retiro</option><option value="envio">Envío</option>
        </select>
      </label>
      <button type="button" onClick={() => void cargar()} className="border border-black px-4 py-2 text-sm font-bold">Buscar / actualizar</button>
    </div>

    {cargando && <p role="status">Cargando órdenes...</p>}
    {error && <div role="alert" className="border border-red-700 p-4 text-red-700"><p>{error}</p><button type="button" onClick={() => void cargar(pagina?.pagina ?? 1)} className="mt-2 underline">Reintentar</button></div>}
    {pagina?.ordenes.length === 0 && !error && !cargando && <p>No hay órdenes para estos filtros.</p>}
    {!!pagina?.ordenes.length && <div className="divide-y divide-gray-300 border-y border-black">
      {pagina.ordenes.map((orden) => <div key={orden.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div><strong>#{orden.id} · {orden.cliente.nombre} {orden.cliente.apellido}</strong><p className="text-sm">{orden.estadoVisible.replaceAll("_", " ")} · {orden.tipoEntrega}</p><p className="text-sm text-gray-600">{fecha(orden.creadaEn)}</p></div>
        <button type="button" onClick={() => void abrir(orden.id)} className="border border-black px-4 py-2 text-sm font-bold">Ver y gestionar</button>
      </div>)}
    </div>}
    {pagina && pagina.paginas > 1 && <div className="flex items-center gap-4 text-sm"><button type="button" disabled={pagina.pagina <= 1} onClick={() => void cargar(pagina.pagina - 1)} className="underline disabled:opacity-40">Anterior</button><span>Página {pagina.pagina} de {pagina.paginas}</span><button type="button" disabled={pagina.pagina >= pagina.paginas} onClick={() => void cargar(pagina.pagina + 1)} className="underline disabled:opacity-40">Siguiente</button></div>}

    {detalle && <article className="border-2 border-black bg-white p-5" aria-labelledby="orden-admin-detalle">
      <div className="flex justify-between gap-4"><h2 id="orden-admin-detalle" className="font-epilogue text-2xl font-bold uppercase">Orden #{detalle.id}</h2><button type="button" onClick={() => setDetalle(null)} className="underline">Cerrar</button></div>
      <p className="mt-2">Cliente: {detalle.cliente.nombre} {detalle.cliente.apellido} · {detalle.cliente.email}</p>
      <p className="mt-2">Estado: {detalle.estadoVisible.replaceAll("_", " ")}</p>
      {detalle.estadoVisible === "reserva_vencida_en_proceso" && <p className="mt-2 text-amber-800">Reserva vencida; cancelación en proceso.</p>}
      <p className="mt-2">Entrega: {detalle.tipoEntrega}. Reserva hasta: {fecha(detalle.venceEn)}</p>
      {detalle.canceladaEn && <p className="mt-2">Cancelada: {fecha(detalle.canceladaEn)}</p>}
      <div className="mt-5 divide-y divide-gray-200 border-y">
        {detalle.detalles.map((linea) => <p key={linea.posicion} className="flex justify-between gap-3 py-3"><span>{linea.nombreProducto} · {linea.talle} / {linea.color} × {linea.cantidad}</span><span>{moneda.format(Number(linea.importeLinea))}</span></p>)}
      </div>
      <p className="mt-4">Subtotal de productos acreditable: <strong>{moneda.format(Number(detalle.subtotalProductos))}</strong></p>
      {detalle.costoMercaderia && detalle.costoMercaderia.estado !== "sin_pago" && <section className="mt-4 border border-black p-4" aria-label="Costo y margen de mercadería">
        <h3 className="font-bold">Costo y margen de mercadería</h3>
        {detalle.costoMercaderia.estado === "sin_fifo" ? <p className="mt-2">Esta orden no tiene origen FIFO registrado; su margen no está determinado.</p> : <>
          <p className="mt-2">Importe atribuido: {moneda.format(Number(detalle.costoMercaderia.importeAtribuido))}. Costo conocido: {moneda.format(Number(detalle.costoMercaderia.costoConocido))}.</p>
          {detalle.costoMercaderia.margenBruto === null
            ? <p className="mt-2 text-amber-800">Margen no determinado: {detalle.costoMercaderia.unidadesSinCosto ? `${detalle.costoMercaderia.unidadesSinCosto} unidad(es) sin costo conocido` : "hay unidades sin asignación FIFO completa"}.</p>
            : <p className="mt-2 font-semibold">Margen bruto de mercadería: {moneda.format(Number(detalle.costoMercaderia.margenBruto))}</p>}
          <ul className="mt-2 space-y-1 text-sm">
            {detalle.costoMercaderia.origenes.map((origen, indice) => <li key={`${origen.partidaId}-${indice}`}>
              Partida #{origen.partidaId} · {origen.proveedorNombre ?? origen.origen} · {origen.cantidad} unidad(es) · importe {origen.importeEfectivo === null ? "no disponible" : moneda.format(Number(origen.importeEfectivo))} · costo {origen.costoConocido === null ? "desconocido" : moneda.format(Number(origen.costoConocido))}
            </li>)}
          </ul>
        </>}
      </section>}
      {detalle.estadoCostoEnvio === "sin_cotizar" ? <><p className="mt-2">Envío: costo a coordinar</p><p className="mt-2">Total final pendiente.</p></>
        : detalle.estadoCostoEnvio === "no_aplica" ? <p className="mt-2">Total retiro: {moneda.format(Number(detalle.totalFinal))}</p>
          : <p className="mt-2">Importes heredados: total registrado {detalle.totalFinal ?? "no disponible"}.</p>}
      {detalle.envioCoordinado && <p className="mt-2">Coordinación externa registrada: {fecha(detalle.envioCoordinadoEn)} por usuario #{detalle.envioCoordinadoPorId}. No acredita un monto de envío aquí.</p>}
      {detalle.motivoCancelacion && <p className="mt-2">Motivo de cancelación: {detalle.motivoCancelacion}. Restituir stock: {detalle.restituirStock === null ? "no aplica" : detalle.restituirStock ? "sí" : "no"}.</p>}
      {detalle.devolucion === "pendiente_de_gestionar" && !detalle.devolucionesCliente?.length && <p className="mt-2 font-semibold">Devolución pendiente de gestionar; no se registró reembolso.</p>}

      {pendiente && <button type="button" disabled={ocupado} onClick={() => void accion("pago", "POST", {})} className="mt-6 bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Confirmar pago manual ({moneda.format(Number(detalle.subtotalProductos))})</button>}
      {siguientes.map((estado) => <div key={estado} className="mt-5">
        {estado === "enviada" && <label className="mb-3 flex items-start gap-2"><input type="checkbox" checked={envioCoordinado} onChange={(event) => setEnvioCoordinado(event.target.checked)} /> Confirmo que costo y cobro del envío se coordinaron externamente.</label>}
        <button type="button" disabled={ocupado || (estado === "enviada" && !envioCoordinado)} onClick={() => void accion("estado", "PATCH", { estado, ...(estado === "enviada" ? { envioCoordinado: true } : {}) })} className="border border-black px-4 py-2 text-sm font-bold disabled:opacity-40">Pasar a {estado.replaceAll("_", " ")}</button>
      </div>)}

      {(pendiente || (pagada && detalle.estado !== "enviada")) && <div className="mt-7 border-t border-black pt-5">
        <h3 className="font-bold uppercase">Cancelar orden</h3>
        <label className="mt-3 block text-sm">Motivo
          <textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} maxLength={500} className="mt-1 block min-h-20 w-full border border-black p-3" />
        </label>
        {pagada && <label className="mt-3 block text-sm">¿Restituir stock?
          <select value={restituirStock} onChange={(event) => setRestituirStock(event.target.value)} className="mt-1 block border border-black p-2"><option value="">Elegir</option><option value="si">Sí</option><option value="no">No</option></select>
        </label>}
        <button type="button" disabled={ocupado || !motivo.trim() || Boolean(pagada && !restituirStock)}
          onClick={() => { if (window.confirm(`¿Cancelar la orden #${detalle.id}?`)) void accion("cancelacion", "POST", { motivo: motivo.trim(), ...(pagada ? { restituirStock: restituirStock === "si" } : {}) }); }}
          className="mt-4 border border-red-700 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-40">Cancelar orden</button>
      </div>}

      {detalle.pagoConfirmadoEn && <section className="mt-8 border-t border-black pt-5" aria-label="Devoluciones de cliente">
        <h3 className="font-bold uppercase">Devoluciones y reintegros</h3>
        <p className="mt-2 text-sm">Aceptar una devolución calcula el importe en el servidor y revierte el costo. El stock vendible solo aumenta al registrar unidades aptas recibidas.</p>
        {(["enviada", "entregada"].includes(detalle.estado)) && <><div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Línea de venta
            <select className="mt-1 block w-full border border-black p-2" value={lineaDevolucionId || ""} onChange={(e) => { setLineaDevolucionId(Number(e.target.value)); setClaveDevolucion(""); }}>
              <option value="">Seleccioná</option>
              {detalle.detalles.map((linea) => <option key={linea.id} value={linea.id}>{linea.nombreProducto} · {linea.talle} · máximo {linea.cantidad}</option>)}
            </select>
          </label>
          <label className="text-sm">Unidades a aceptar
            <input type="number" min={1} max={detalle.detalles.find((linea) => linea.id === lineaDevolucionId)?.cantidad ?? 1}
              value={cantidadDevolucion} onChange={(e) => { setCantidadDevolucion(Number(e.target.value)); setClaveDevolucion(""); }}
              className="mt-1 block w-full border border-black p-2" />
          </label>
        </div>
        <label className="mt-3 block text-sm">Motivo
          <textarea value={motivoDevolucion} onChange={(e) => { setMotivoDevolucion(e.target.value); setClaveDevolucion(""); }} maxLength={500} className="mt-1 block w-full border border-black p-2" />
        </label>
        <button type="button" disabled={ocupado || !lineaDevolucionId || cantidadDevolucion < 1 || !motivoDevolucion.trim()}
          onClick={() => { const clave = claveDevolucion || crypto.randomUUID(); setClaveDevolucion(clave);
            if (window.confirm(`¿Aceptar ${cantidadDevolucion} unidad(es) de la orden #${detalle.id}? El importe se calcula en el servidor.`))
              void enviarDevolucion("devoluciones", { lineas: [{ detalleOrdenId: lineaDevolucionId, cantidad: cantidadDevolucion }], motivo: motivoDevolucion.trim() }, clave,
                () => { setClaveDevolucion(""); setMotivoDevolucion(""); }); }}
          className="mt-3 border border-black px-4 py-2 text-sm font-bold disabled:opacity-40">Aceptar devolución</button></>}

        {!!detalle.devolucionesCliente?.length && <div className="mt-6 space-y-3">
          {detalle.devolucionesCliente.map((devolucion) => <div key={devolucion.id} className="border border-neutral-400 p-3 text-sm">
            <p><strong>Devolución #{devolucion.id}</strong> · {devolucion.cantidad} unidad(es) · {devolucion.estado}{devolucion.esCancelacionAnteriorSalida ? " · cancelación antes de salida" : ""}</p>
            <p>Debido {moneda.format(Number(devolucion.importeDebido))} · reintegrado {moneda.format(Number(devolucion.importeReintegradoAcumulado))} · saldo {moneda.format(Number(devolucion.saldoPendiente))}</p>
            <p>Recepciones: {devolucion.recepciones.map((recepcion) => `${recepcion.cantidadApta} apta(s), ${recepcion.cantidadDanada} dañada(s)`).join("; ") || "ninguna"}</p>
          </div>)}
          <label className="block text-sm">Gestionar devolución
            <select className="mt-1 block w-full border border-black p-2" value={devolucionId || ""} onChange={(e) => { setDevolucionId(Number(e.target.value)); setGestionDevolucion("reintegros"); setClaveGestion(""); }}>
              <option value="">Seleccioná</option>
              {detalle.devolucionesCliente.map((devolucion) => <option key={devolucion.id} value={devolucion.id}>#{devolucion.id} · {devolucion.estado}</option>)}
            </select>
          </label>
          <label className="block text-sm">Acción
            <select className="mt-1 block w-full border border-black p-2" value={gestionDevolucion} onChange={(e) => { setGestionDevolucion(e.target.value as typeof gestionDevolucion); setClaveGestion(""); }}>
              <option value="reintegros">Registrar reintegro</option><option value="cierre-sin-reintegro">Cerrar saldo sin reintegro</option>
              {!detalle.devolucionesCliente.find((devolucion) => devolucion.id === devolucionId)?.esCancelacionAnteriorSalida && <option value="recepciones">Recibir unidades</option>}
            </select>
          </label>
          {gestionDevolucion === "reintegros" && <label className="block text-sm">Importe efectivo reintegrado
            <input type="text" inputMode="decimal" value={importeReintegro} onChange={(e) => { setImporteReintegro(e.target.value); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" />
          </label>}
          {gestionDevolucion === "recepciones" && <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Unidades aptas<input type="number" min={0} value={cantidadApta} onChange={(e) => { setCantidadApta(Number(e.target.value)); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" /></label>
            <label className="text-sm">Unidades dañadas<input type="number" min={0} value={cantidadDanada} onChange={(e) => { setCantidadDanada(Number(e.target.value)); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" /></label>
          </div>}
          {gestionDevolucion !== "reintegros" && <label className="block text-sm">Motivo
            <textarea value={motivoGestion} onChange={(e) => { setMotivoGestion(e.target.value); setClaveGestion(""); }} className="mt-1 block w-full border border-black p-2" />
          </label>}
          <button type="button" disabled={ocupado || !devolucionId || (gestionDevolucion === "reintegros" && !importeReintegro)
            || (gestionDevolucion === "cierre-sin-reintegro" && !motivoGestion.trim())
            || (gestionDevolucion === "recepciones" && cantidadApta + cantidadDanada < 1)}
            onClick={() => { const clave = claveGestion || crypto.randomUUID(); setClaveGestion(clave);
              if (window.confirm(`¿Registrar ${gestionDevolucion.replaceAll("-", " ")} para la devolución #${devolucionId}?`))
                void enviarDevolucion(`devoluciones/${devolucionId}/${gestionDevolucion}`,
                  gestionDevolucion === "reintegros" ? { importeEfectivo: importeReintegro }
                    : gestionDevolucion === "cierre-sin-reintegro" ? { motivo: motivoGestion.trim() }
                      : { cantidadApta, cantidadDanada, ...(motivoGestion.trim() ? { motivo: motivoGestion.trim() } : {}) },
                  clave, () => { setClaveGestion(""); setImporteReintegro(""); setMotivoGestion(""); setCantidadApta(0); setCantidadDanada(0); }); }}
            className="border border-black px-4 py-2 text-sm font-bold disabled:opacity-40">Registrar acción</button>
        </div>}
        {mensajeDevolucion && <p role="status" className="mt-3 text-sm">{mensajeDevolucion}</p>}
      </section>}

      <h3 className="mt-8 border-t border-black pt-5 font-bold uppercase">Historial de estados</h3>
      <ol className="mt-3 space-y-3">{detalle.eventos.map((evento, indice) => <li key={`${evento.fecha}-${indice}`} className="border-l-2 border-black pl-3 text-sm"><strong>{tituloEstadoOrden(evento.estadoNuevo)}</strong> · {fecha(evento.fecha)} · {evento.origen}{evento.actorUsuarioId ? ` · ${evento.actorNombre ?? "Usuario no disponible"}` : ""}{evento.motivo ? ` · ${evento.motivo}` : ""}{evento.restituirStock !== null ? ` · Restituir stock: ${evento.restituirStock ? "sí" : "no"}` : ""}</li>)}</ol>
    </article>}
  </section>;
}
