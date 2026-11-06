"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search, Trash2, Zap } from "lucide-react";
import { ApiError, apiFetch, apiFetchVendedor } from "@/lib/api";
import { MEDIOS_PAGO_LOCAL, formatearDinero, formatearFechaHora, textoMotivo } from "@/lib/venta-local";
import type { Categoria } from "@/types/categoria";
import type { CatalogoLocal, MedioPagoLocal, ResumenVentaLocal, VentaLocal } from "@/types/venta-local";

type Mensaje = { tipo: "ok" | "error"; texto: string } | null;

const inputClass = "w-full border-2 border-black bg-white px-3 py-2 text-sm";
const nuevaClave = () => crypto.randomUUID();
const importeValido = (valor: string) => {
  const texto = valor.trim().replace(",", ".");
  return /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(texto) && Number(texto) > 0;
};

export default function PuntoVenta() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoLocal | null>(null);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [resumen, setResumen] = useState<ResumenVentaLocal | null>(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [medio, setMedio] = useState<MedioPagoLocal | "">("");
  const [errorCliente, setErrorCliente] = useState("");
  const [rapidaAbierta, setRapidaAbierta] = useState(false);
  const [conceptoRapida, setConceptoRapida] = useState("");
  const [importeRapida, setImporteRapida] = useState("");
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  // La venta en curso se guarda en el servidor: si ya tenía líneas al entrar, se avisa.
  const [recuperada, setRecuperada] = useState(false);
  // Una clave por intención de venta: se conserva ante fallas de red para no duplicar.
  const claveRef = useRef(nuevaClave());

  const cargarCatalogo = useCallback(async (texto: string, categoriaId: string) => {
    setCargandoCatalogo(true);
    const parametros = new URLSearchParams();
    if (texto.trim()) parametros.set("buscar", texto.trim());
    if (categoriaId) parametros.set("categoria", categoriaId);
    try {
      setCatalogo(await apiFetchVendedor<CatalogoLocal>(`/productos?${parametros.toString()}`));
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No pudimos cargar los productos." });
    } finally {
      setCargandoCatalogo(false);
    }
  }, []);

  const cargarVenta = useCallback(async () => {
    try {
      setResumen(await apiFetchVendedor<ResumenVentaLocal>("/venta"));
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No pudimos cargar la venta en curso." });
    }
  }, []);

  useEffect(() => {
    apiFetchVendedor<ResumenVentaLocal>("/venta")
      .then((venta) => {
        setResumen(venta);
        setRecuperada(venta.lineas.length > 0);
      })
      .catch((error) => setMensaje({
        tipo: "error", texto: error instanceof ApiError ? error.message : "No pudimos cargar la venta en curso.",
      }));
    apiFetch<Categoria[]>("/categorias").then(setCategorias).catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    const espera = setTimeout(() => cargarCatalogo(busqueda, categoria), 300);
    return () => clearTimeout(espera);
  }, [busqueda, categoria, cargarCatalogo]);

  async function operar(clave: string, accion: () => Promise<ResumenVentaLocal>): Promise<boolean> {
    setProcesando(clave);
    setMensaje(null);
    setRecuperada(false);
    try {
      setResumen(await accion());
      claveRef.current = nuevaClave();
      return true;
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No pudimos actualizar la venta." });
      return false;
    } finally {
      setProcesando(null);
    }
  }

  const agregar = (talleProductoId: number) => operar(`agregar-${talleProductoId}`, () =>
    apiFetchVendedor<ResumenVentaLocal>("/venta/items", {
      method: "POST", body: JSON.stringify({ talleProductoId, cantidad: 1 }),
    }));

  const cambiarCantidad = (itemId: number, cantidad: number) => operar(`item-${itemId}`, () => (cantidad <= 0
    ? apiFetchVendedor<ResumenVentaLocal>(`/venta/items/${itemId}`, { method: "DELETE" })
    : apiFetchVendedor<ResumenVentaLocal>(`/venta/items/${itemId}`, { method: "PUT", body: JSON.stringify({ cantidad }) })));

  const vaciar = () => operar("vaciar", () => apiFetchVendedor<ResumenVentaLocal>("/venta", { method: "DELETE" }));

  // Venta rápida: abrir, escribir el importe y agregar. El servidor valida el importe.
  async function agregarRapida(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!importeValido(importeRapida)) {
      setMensaje({ tipo: "error", texto: "Ingresá un importe mayor que cero, con hasta dos decimales." });
      return;
    }
    const agregada = await operar("rapida", () => apiFetchVendedor<ResumenVentaLocal>("/venta/rapida", {
      method: "POST",
      body: JSON.stringify({ importe: importeRapida.trim().replace(",", "."), concepto: conceptoRapida.trim() || undefined }),
    }));
    if (!agregada) return;
    setImporteRapida("");
    setConceptoRapida("");
    setRapidaAbierta(false);
  }

  async function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumen) return;
    const telefono = telefonoCliente.replace(/[\s().-]/g, "");
    if (telefono && !/^\+?\d{6,20}$/.test(telefono)) {
      setErrorCliente("Ingresá un teléfono de 6 a 20 dígitos o dejalo vacío.");
      return;
    }
    if (!medio) {
      setMensaje({ tipo: "error", texto: "Elegí un medio de pago." });
      return;
    }
    setErrorCliente("");
    setProcesando("confirmar");
    setMensaje(null);
    try {
      const { venta } = await apiFetchVendedor<{ venta: VentaLocal }>("/venta/confirmacion", {
        method: "POST",
        body: JSON.stringify({
          claveConfirmacion: claveRef.current, huellaResumen: resumen.huellaResumen, metodoPago: medio,
          ...(nombreCliente.trim() ? { nombreCliente: nombreCliente.trim() } : {}),
          ...(telefono ? { telefonoCliente: telefono } : {}),
        }),
      });
      claveRef.current = nuevaClave();
      router.push(`/vendedor/ventas/${venta.id}?nueva=1`);
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        claveRef.current = nuevaClave();
        if (error.codigo === "CLIENTE_INVALIDO") setErrorCliente(error.message);
        if (["RESUMEN_CAMBIO", "ITEMS_NO_DISPONIBLES", "CAJA_NO_ABIERTA", "CAJA_JORNADA_ANTERIOR"].includes(error.codigo ?? "")) {
          await cargarVenta();
        }
      }
      setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No pudimos confirmar la venta. Reintentá." });
      setProcesando(null);
    }
  }

  const lineas = resumen?.lineas ?? [];
  const cantidadTotal = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <section aria-label="Catálogo del local">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
          <label className="relative block">
            <span className="sr-only">Buscar por nombre o código</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre o código"
              className={`${inputClass} pl-9`} autoFocus />
          </label>
          <select value={categoria} onChange={(event) => setCategoria(event.target.value)} className={inputClass} aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            {categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </select>
        </div>

        {cargandoCatalogo && !catalogo ? <p className="text-sm">Cargando productos...</p> : null}
        {catalogo && catalogo.productos.length === 0 && (
          <p className="border-2 border-dashed border-neutral-400 p-6 text-sm text-neutral-600">No hay productos disponibles en el local que coincidan con la búsqueda.</p>
        )}
        <ul className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${cargandoCatalogo ? "opacity-60" : ""}`}>
          {catalogo?.productos.map((producto) => (
            <li key={producto.id} className={`flex flex-col border-2 border-black ${producto.sinStock ? "bg-neutral-100" : "bg-white"}`}>
              <div className={`flex gap-3 p-3 ${producto.sinStock ? "opacity-60" : ""}`}>
                {producto.imagen
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={producto.imagen} alt="" className="h-20 w-16 shrink-0 border border-black object-cover" />
                  : <div className="h-20 w-16 shrink-0 border border-black bg-neutral-100" aria-hidden />}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">#{producto.id} · {producto.categoria}</p>
                  <h2 className="font-epilogue text-sm font-black uppercase leading-tight">{producto.nombre}</h2>
                  <p className="mt-1 text-sm font-bold">{formatearDinero(producto.precio)}</p>
                  {!producto.web && <span className="mt-1 inline-block bg-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">Solo local</span>}
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-black p-3">
                {producto.sinStock && <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Sin stock</span>}
                {producto.variantes.map((variante) => (
                  <button key={variante.id} type="button" onClick={() => agregar(variante.id)} disabled={procesando !== null}
                    aria-label={`Agregar ${producto.nombre} talle ${variante.talle} color ${variante.color}`}
                    className="flex items-center gap-1.5 border border-black px-2 py-1 text-xs font-bold hover:bg-black hover:text-white disabled:opacity-50">
                    <span className="h-3 w-3 border border-black" style={{ backgroundColor: variante.hex }} aria-hidden />
                    {variante.talle} · {variante.color}
                    <span className="font-normal text-neutral-500">({variante.stockDisponible})</span>
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Venta en curso" className="h-fit border-2 border-black bg-white lg:sticky lg:top-24">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-white">
          <h2 className="font-epilogue text-sm font-black uppercase tracking-widest">Venta actual</h2>
          <span className="text-xs">{cantidadTotal} {cantidadTotal === 1 ? "unidad" : "unidades"}</span>
        </div>

        {resumen && !resumen.caja && (
          <div className="border-b-2 border-black bg-amber-50 px-4 py-3 text-sm">
            <p className="font-bold">La caja está cerrada.</p>
            <Link href="/vendedor/caja" className="font-bold underline">Abrí la caja</Link> para poder confirmar ventas.
          </div>
        )}

        {resumen?.caja?.deJornadaAnterior && (
          <div role="alert" className="border-b-2 border-black bg-red-50 px-4 py-3 text-sm">
            <p className="font-bold">La caja quedó abierta desde el {formatearFechaHora(resumen.caja.abiertaEn)}.</p>
            <Link href="/vendedor/caja" className="font-bold underline">Cerrala</Link> y abrí una nueva para seguir vendiendo.
          </div>
        )}

        {recuperada && lineas.length > 0 && (
          <div role="status" className="flex items-center justify-between gap-3 border-b-2 border-black bg-neutral-100 px-4 py-3 text-sm">
            <p><span className="font-bold">Retomaste una venta en curso.</span> Revisá los productos antes de confirmar.</p>
            <button type="button" onClick={vaciar} disabled={procesando !== null}
              className="shrink-0 text-xs font-bold uppercase underline disabled:opacity-50">Vaciar</button>
          </div>
        )}

        <div className="border-b-2 border-black px-4 py-3">
          {!rapidaAbierta
            ? <button type="button" onClick={() => setRapidaAbierta(true)} disabled={procesando !== null}
                className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-black px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 disabled:opacity-50">
                <Zap size={14} aria-hidden /> Venta rápida
              </button>
            : (
              <form onSubmit={agregarRapida} className="space-y-2" aria-label="Venta rápida">
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Concepto (opcional)
                    <input value={conceptoRapida} onChange={(event) => setConceptoRapida(event.target.value)} maxLength={80}
                      placeholder="Accesorio" className={`${inputClass} mt-1`} />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider">Importe
                    <input value={importeRapida} onChange={(event) => setImporteRapida(event.target.value)} inputMode="decimal"
                      placeholder="0,00" className={`${inputClass} mt-1`} autoFocus required />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button disabled={procesando !== null || !importeValido(importeRapida)}
                    className="flex-1 bg-black px-3 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40">
                    {procesando === "rapida" ? "Agregando..." : "Agregar"}
                  </button>
                  <button type="button" onClick={() => setRapidaAbierta(false)} className="px-3 py-2 text-xs font-bold uppercase underline">Cancelar</button>
                </div>
                <p className="text-[11px] text-neutral-500">Para artículos que no están cargados. No descuenta stock.</p>
              </form>
            )}
        </div>

        {lineas.length === 0
          ? <p className="px-4 py-8 text-center text-sm text-neutral-500">Elegí talle y color de un producto o usá la venta rápida.</p>
          : (
            <ul className="max-h-[40vh] divide-y divide-neutral-200 overflow-y-auto">
              {lineas.map((linea) => (
                <li key={linea.itemCarritoId} className={`px-4 py-3 ${linea.disponible ? "" : "bg-red-50"}`}>
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{linea.nombreProducto}</p>
                      <p className="text-xs text-neutral-600">
                        {linea.ventaRapida ? "Venta rápida" : `${linea.talle} · ${linea.color}`} · {formatearDinero(linea.precioVigente)} c/u
                      </p>
                      {linea.motivosBloqueo.map((motivo) => <p key={motivo} className="text-xs font-bold text-red-700">{textoMotivo(motivo)}</p>)}
                      {linea.cambioPrecio && <p className="text-xs font-bold text-amber-700">El precio cambió</p>}
                    </div>
                    <p className="shrink-0 text-sm font-bold">{formatearDinero(linea.importeLinea)}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => cambiarCantidad(linea.itemCarritoId, linea.cantidad - 1)} disabled={procesando !== null}
                      className="border border-black p-1 disabled:opacity-50" aria-label="Restar una unidad"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-bold">{linea.cantidad}</span>
                    <button type="button" onClick={() => cambiarCantidad(linea.itemCarritoId, linea.cantidad + 1)}
                      disabled={procesando !== null || (!linea.ventaRapida && linea.cantidad >= linea.stockDisponible)}
                      className="border border-black p-1 disabled:opacity-50" aria-label="Sumar una unidad"><Plus size={14} /></button>
                    <button type="button" onClick={() => cambiarCantidad(linea.itemCarritoId, 0)} disabled={procesando !== null}
                      className="ml-auto p-1 text-neutral-500 hover:text-black disabled:opacity-50" aria-label="Quitar producto"><Trash2 size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}

        <form onSubmit={confirmar} className="space-y-4 border-t-2 border-black p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-widest">Total</span>
            <span className="font-epilogue text-3xl font-black">{formatearDinero(resumen?.total ?? "0")}</span>
          </div>
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider">Cliente (opcional)</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input value={nombreCliente} onChange={(event) => { setNombreCliente(event.target.value); setErrorCliente(""); }}
                maxLength={100} placeholder="Nombre" aria-label="Nombre del cliente" className={inputClass} autoComplete="off" />
              <input value={telefonoCliente} onChange={(event) => { setTelefonoCliente(event.target.value); setErrorCliente(""); }}
                inputMode="tel" placeholder="Teléfono" aria-label="Teléfono del cliente" className={inputClass} autoComplete="off"
                aria-invalid={Boolean(errorCliente)} aria-describedby="error-cliente" />
            </div>
          </fieldset>
          {errorCliente && <p id="error-cliente" className="text-xs font-bold text-red-700">{errorCliente}</p>}
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider">Medio de pago</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {MEDIOS_PAGO_LOCAL.map((opcion) => (
                <label key={opcion.valor} className={`cursor-pointer border-2 border-black px-3 py-2 text-center text-xs font-bold uppercase ${medio === opcion.valor ? "bg-black text-white" : "bg-white"}`}>
                  <input type="radio" name="medio" value={opcion.valor} checked={medio === opcion.valor} onChange={() => setMedio(opcion.valor)} className="sr-only" />
                  {opcion.etiqueta}
                </label>
              ))}
            </div>
          </fieldset>
          {mensaje && <p role="status" className={`text-sm font-bold ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-700"}`}>{mensaje.texto}</p>}
          <button disabled={!resumen?.puedeConfirmar || procesando !== null}
            className="w-full bg-black px-4 py-3 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-40">
            {procesando === "confirmar" ? "Confirmando..." : "Confirmar venta"}
          </button>
          {lineas.length > 0 && (
            <button type="button" onClick={vaciar} disabled={procesando !== null} className="w-full text-xs font-bold uppercase underline disabled:opacity-50">
              Vaciar venta
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}
