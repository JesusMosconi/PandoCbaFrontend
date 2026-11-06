"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, CreditCard, PackageCheck, PackageOpen, RefreshCw,
  RotateCcw, ShoppingBag, Store, Truck, type LucideIcon,
} from "lucide-react";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import type { PendientesInicio } from "@/types/estadisticas";

const INTERVALO_MS = 60_000;
const hora = (fecha: string) => new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires",
}).format(new Date(fecha));

type Tarea = { clave: string; cantidad: number; titulo: string; ayuda: string; href: string; icono: LucideIcon; urgente?: boolean };

function tareas(datos: PendientesInicio): Tarea[] {
  const { ordenes } = datos;
  return [
    { clave: "incidencias", cantidad: datos.incidenciasPago, titulo: "Incidencias de pago", urgente: true,
      ayuda: "Pagos con diferencias que necesitan una resolución.", href: "/admin/ordenes", icono: AlertTriangle },
    { clave: "pago", cantidad: ordenes.pagoPorConfirmar, titulo: "Pagos por confirmar",
      ayuda: "Órdenes reservadas que todavía no vencieron.", href: "/admin/ordenes?estado=pendiente_pago", icono: CreditCard },
    { clave: "preparar", cantidad: ordenes.porPreparar, titulo: "Por preparar",
      ayuda: "Pagadas y sin empezar a armar.", href: "/admin/ordenes?estado=pago_confirmado", icono: ClipboardList },
    { clave: "preparacion", cantidad: ordenes.enPreparacion, titulo: "En preparación",
      ayuda: "Falta marcarlas listas o enviadas.", href: "/admin/ordenes?estado=en_preparacion", icono: PackageOpen },
    { clave: "retiro", cantidad: ordenes.esperandoRetiro, titulo: "Esperando retiro",
      ayuda: "Listas para que el cliente las busque.", href: "/admin/ordenes?estado=lista_para_retiro", icono: PackageCheck },
    { clave: "camino", cantidad: ordenes.enCamino, titulo: "En camino",
      ayuda: "Enviadas; falta confirmar la entrega.", href: "/admin/ordenes?estado=enviada", icono: Truck },
    { clave: "reintegros", cantidad: datos.reintegrosPendientes, titulo: "Reintegros pendientes",
      ayuda: "Devoluciones aceptadas con saldo a devolver.", href: "/admin/ordenes", icono: RotateCcw },
    { clave: "compras", cantidad: datos.comprasBorrador, titulo: "Compras en borrador",
      ayuda: "Entregas cargadas que no ingresaron al stock.", href: "/admin/compras", icono: ShoppingBag },
  ];
}

function TarjetaTarea({ tarea }: { tarea: Tarea }) {
  const { cantidad, titulo, ayuda, href, icono: Icono, urgente } = tarea;
  const activa = cantidad > 0;
  return <Link href={href}
    className={`group flex flex-col justify-between border p-3 transition-colors sm:p-4 ${activa
      ? `border-black bg-white hover:bg-neutral-50 ${urgente ? "border-l-[6px] border-l-red-700" : "border-l-[6px]"}`
      : "border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-neutral-500"}`}>
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-2 text-xs font-bold sm:text-sm">
        <Icono className={`h-4 w-4 shrink-0 ${activa && urgente ? "text-red-700" : ""}`} aria-hidden />{titulo}
      </span>
      <span className={`font-epilogue text-2xl font-black leading-none sm:text-3xl ${activa ? "text-black" : ""}`}>{cantidad}</span>
    </div>
    <p className={`mt-2 text-xs leading-5 sm:mt-3 ${activa ? "" : "hidden sm:block"}`}>{activa ? ayuda : "Al día"}</p>
    {activa && <span className="mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-black">
      Ver <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </span>}
  </Link>;
}

export default function AdminPendientes() {
  const [datos, setDatos] = useState<PendientesInicio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setCargando(true); setError("");
    apiFetchAdmin<PendientesInicio>("/estadisticas/pendientes")
      .then(setDatos)
      .catch((falla) => setError(falla instanceof ApiError ? falla.message : "No pudimos cargar los pendientes."))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    const intervalo = window.setInterval(cargar, INTERVALO_MS);
    return () => window.clearInterval(intervalo);
  }, [cargar]);

  const lista = datos ? tareas(datos) : [];
  const abiertas = lista.filter((tarea) => tarea.cantidad > 0).length;

  return <section aria-labelledby="pendientes-titulo" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="pendientes-titulo" className="font-epilogue text-2xl font-black uppercase">Para atender</h2>
        <p className="mt-1 text-sm text-neutral-600" aria-live="polite">
          {!datos ? "Revisando órdenes, stock y caja…"
            : abiertas === 0 ? "No hay tareas pendientes. Todo al día."
              : `${abiertas} ${abiertas === 1 ? "tipo de tarea requiere" : "tipos de tarea requieren"} atención.`}
        </p>
      </div>
      <button type="button" onClick={cargar} disabled={cargando}
        className="flex items-center gap-2 border border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] hover:bg-neutral-50 disabled:opacity-50">
        <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} aria-hidden />
        {datos ? `Actualizado ${hora(datos.generadoEn)}` : "Actualizar"}
      </button>
    </div>

    {error && <div role="alert" className="border border-red-700 bg-white p-4 text-sm text-red-700">
      <p>{error}</p><button type="button" onClick={cargar} className="mt-1 underline">Reintentar</button>
    </div>}

    {datos && <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {lista.map((tarea) => <TarjetaTarea key={tarea.clave} tarea={tarea} />)}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Link href="/vendedor/caja" className={`flex items-start gap-3 border bg-white p-4 text-sm hover:bg-neutral-50 ${datos.caja.abierta && datos.caja.deJornadaAnterior ? "border-black border-l-[6px] border-l-red-700" : "border-black"}`}>
          <Store className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="block font-bold">Caja del local</span>
            {!datos.caja.abierta ? <span className="text-neutral-600">Cerrada. Se abre desde el punto de venta.</span>
              : datos.caja.deJornadaAnterior
                ? <span className="text-red-700"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" aria-hidden />Quedó abierta desde una jornada anterior: hay que cerrarla para seguir vendiendo.</span>
                : <span className="text-neutral-600">Abierta desde las {hora(datos.caja.abiertaEn)} · {datos.caja.ventas} {datos.caja.ventas === 1 ? "venta" : "ventas"}.</span>}
          </span>
        </Link>

        <div className="min-w-0 border border-black bg-white p-4 text-sm lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-bold">Stock crítico</p>
            <Link href="/admin/productos" className="text-xs font-semibold underline">Ir a productos</Link>
          </div>
          {datos.stock.agotadas + datos.stock.bajas === 0
            ? <p className="mt-2 flex items-center gap-2 text-neutral-600"><CheckCircle2 className="h-4 w-4" aria-hidden />Todas las variantes activas tienen más de {datos.stock.umbralBajo} unidades disponibles.</p>
            : <>
              <p className="mt-1 text-neutral-600">
                {datos.stock.agotadas} {datos.stock.agotadas === 1 ? "variante agotada" : "variantes agotadas"} y {datos.stock.bajas} con {datos.stock.umbralBajo} unidades o menos (disponible = stock menos reservas).
              </p>
              <ul className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {datos.stock.variantes.map((variante) => <li key={variante.varianteId} className="flex items-center justify-between gap-3 border-b border-neutral-200 py-1.5">
                  <Link href={`/admin/productos/${variante.productoId}`} className="min-w-0 truncate hover:underline">
                    {variante.producto} <span className="text-neutral-500">· {variante.talle} · {variante.color}</span>
                  </Link>
                  <span className={`shrink-0 text-xs font-bold uppercase ${variante.disponible === 0 ? "text-red-700" : ""}`}>
                    {variante.disponible === 0 ? "Agotado" : `${variante.disponible} u.`}
                  </span>
                </li>)}
              </ul>
              {datos.stock.agotadas + datos.stock.bajas > datos.stock.variantes.length
                && <p className="mt-2 text-xs text-neutral-500">Se muestran {datos.stock.variantes.length} de {datos.stock.agotadas + datos.stock.bajas}.</p>}
            </>}
        </div>
      </div>
    </>}
  </section>;
}
