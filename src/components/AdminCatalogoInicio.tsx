"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetchAdmin } from "@/lib/api";
import type { SeleccionCatalogoInicio } from "@/types/catalogo-inicio";
import type { Producto } from "@/types/producto";

function motivo(producto: Pick<Producto, "activo" | "web">): string | null {
  const razones = [
    !producto.activo ? "inactivo" : null,
    !producto.web ? "no publicado" : null,
  ].filter(Boolean);
  return razones.length ? `Oculto en Inicio: ${razones.join(" y ")}` : null;
}

export default function AdminCatalogoInicio() {
  const [seleccion, setSeleccion] = useState<SeleccionCatalogoInicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [borrador, setBorrador] = useState<number[]>([]);
  const [productoElegido, setProductoElegido] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [nuevaSeleccion, nuevosProductos] = await Promise.all([
        apiFetchAdmin<SeleccionCatalogoInicio[]>("/catalogo-inicio/seleccion", { cache: "no-store" }),
        apiFetchAdmin<Producto[]>("/productos?admin=true", { cache: "no-store" }),
      ]);
      setSeleccion(nuevaSeleccion);
      setBorrador(nuevaSeleccion.map((entrada) => entrada.productoId));
      setProductos(nuevosProductos);
      setMensaje(null);
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : "No pudimos cargar la selección.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      apiFetchAdmin<SeleccionCatalogoInicio[]>("/catalogo-inicio/seleccion", { cache: "no-store" }),
      apiFetchAdmin<Producto[]>("/productos?admin=true", { cache: "no-store" }),
    ]).then(([nuevaSeleccion, nuevosProductos]) => {
      if (!vigente) return;
      setSeleccion(nuevaSeleccion);
      setBorrador(nuevaSeleccion.map((entrada) => entrada.productoId));
      setProductos(nuevosProductos);
    }).catch((error: unknown) => {
      if (vigente) setErrorCarga(error instanceof Error ? error.message : "No pudimos cargar la selección.");
    }).finally(() => {
      if (vigente) setCargando(false);
    });
    return () => { vigente = false; };
  }, []);

  const porId = useMemo(() => new Map(productos.map((producto) => [producto.id, producto])), [productos]);
  const disponibles = productos.filter((producto) => !borrador.includes(producto.id));
  const confirmado = seleccion.map((entrada) => entrada.productoId);
  const hayCambios = borrador.length !== confirmado.length
    || borrador.some((id, indice) => id !== confirmado[indice]);

  function mover(indice: number, diferencia: number) {
    const siguiente = [...borrador];
    [siguiente[indice], siguiente[indice + diferencia]] = [siguiente[indice + diferencia], siguiente[indice]];
    setBorrador(siguiente);
    setMensaje(null);
  }

  function agregar() {
    const id = Number(productoElegido);
    if (!Number.isSafeInteger(id) || id <= 0 || !porId.has(id) || borrador.includes(id) || borrador.length >= 5) return;
    setBorrador([...borrador, id]);
    setProductoElegido("");
    setMensaje(null);
  }

  async function guardar() {
    if (guardando || !hayCambios) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const confirmada = await apiFetchAdmin<SeleccionCatalogoInicio[]>("/catalogo-inicio/seleccion", {
        method: "PUT",
        body: JSON.stringify({ productoIds: borrador }),
      });
      setSeleccion(confirmada);
      setBorrador(confirmada.map((entrada) => entrada.productoId));
      setMensaje({ tipo: "ok", texto: "Selección guardada." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof Error ? error.message : "No pudimos guardar. Reintentá." });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p role="status">Cargando selección...</p>;
  if (errorCarga) return (
    <div role="alert" className="border border-red-700 bg-white p-5 text-red-700">
      <p>{errorCarga}</p>
      <button type="button" onClick={() => void cargar()} className="mt-3 underline">Reintentar</button>
    </div>
  );

  return (
    <section className="space-y-7">
      <div className="border border-black bg-white p-5">
        <h2 className="font-epilogue text-xl font-bold">Productos seleccionados ({borrador.length}/5)</h2>
        <p className="mt-2 text-sm text-neutral-600">El primer producto visible ocupará la tarjeta grande; los siguientes, las pequeñas.</p>
        <button type="button" onClick={() => void cargar()} disabled={guardando || hayCambios} className="mt-2 text-sm underline disabled:opacity-40">Actualizar estado</button>
        {borrador.length === 0 && <p className="mt-4 text-sm text-neutral-600">Todavía no hay productos seleccionados.</p>}
        <ol className="mt-4 space-y-3">
          {borrador.map((id, indice) => {
            const producto = porId.get(id);
            const anterior = seleccion.find((entrada) => entrada.productoId === id);
            const aviso = anterior ? motivo(anterior.producto) : producto
              ? motivo(producto) : "Producto no disponible para editar";
            return (
              <li key={id} className="flex flex-wrap items-center justify-between gap-3 border border-neutral-300 p-3">
                <div>
                  <p className="font-semibold">{indice + 1}. {producto?.nombre ?? anterior?.producto.nombre ?? `Producto ${id}`}</p>
                  {aviso && <p className="mt-1 text-sm font-medium text-amber-800">{aviso}</p>}
                </div>
                <div className="flex gap-2 text-sm">
                  <button type="button" disabled={indice === 0 || guardando} onClick={() => mover(indice, -1)} aria-label={`Subir ${producto?.nombre ?? id}`} className="border border-black px-2 py-1 disabled:opacity-40">↑</button>
                  <button type="button" disabled={indice === borrador.length - 1 || guardando} onClick={() => mover(indice, 1)} aria-label={`Bajar ${producto?.nombre ?? id}`} className="border border-black px-2 py-1 disabled:opacity-40">↓</button>
                  <button type="button" disabled={guardando} onClick={() => { setBorrador(borrador.filter((valor) => valor !== id)); setMensaje(null); }} className="border border-black px-2 py-1 disabled:opacity-40">Quitar</button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="border border-black bg-white p-5">
        <label htmlFor="producto-catalogo-inicio" className="block text-sm font-semibold">Agregar producto</label>
        <div className="mt-3 flex flex-wrap gap-3">
          <select id="producto-catalogo-inicio" value={productoElegido} onChange={(event) => setProductoElegido(event.target.value)} disabled={guardando || borrador.length >= 5} className="min-w-64 flex-1 border border-black bg-white p-2">
            <option value="">Elegí un producto</option>
            {disponibles.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre} · ID {producto.id}{motivo(producto) ? " · oculto" : ""}</option>)}
          </select>
          <button type="button" onClick={agregar} disabled={guardando || borrador.length >= 5 || !productoElegido} className="bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Agregar</button>
        </div>
        {borrador.length >= 5 && <p className="mt-2 text-sm text-neutral-600">Se alcanzó el máximo de cinco productos, incluidos los ocultos.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void guardar()} disabled={guardando || !hayCambios} className="bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{guardando ? "Guardando..." : "Guardar selección"}</button>
        <button type="button" onClick={() => { setBorrador(confirmado); setMensaje(null); }} disabled={guardando || !hayCambios} className="border border-black px-5 py-3 text-sm disabled:opacity-40">Descartar cambios</button>
        {mensaje && <p role={mensaje.tipo === "error" ? "alert" : "status"} className={mensaje.tipo === "error" ? "text-red-700" : "text-green-700"}>{mensaje.texto}</p>}
      </div>
    </section>
  );
}
