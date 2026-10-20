"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import type { PaginaProveedores, Proveedor, ProveedorDetalle } from "@/types/proveedor";

const campo = "w-full border border-neutral-400 bg-white px-3 py-2 text-sm";

export default function AdminProveedores() {
  const [pagina, setPagina] = useState<PaginaProveedores | null>(null);
  const [detalle, setDetalle] = useState<ProveedorDetalle | null>(null);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  async function cargar(numero = 1) {
    setCargando(true);
    setError("");
    try {
      setPagina(await apiFetchAdmin<PaginaProveedores>(`/proveedores?pagina=${numero}&limite=20`));
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar proveedores. Reintentá.");
    } finally {
      setCargando(false);
    }
  }

  async function abrir(id: number) {
    setError("");
    try {
      const proveedor = await apiFetchAdmin<ProveedorDetalle>(`/proveedores/${id}`);
      setDetalle(proveedor);
      setNombre(proveedor.nombre);
      setContacto(proveedor.contacto ?? "");
      setObservaciones(proveedor.observaciones ?? "");
      setMotivo("");
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar el proveedor. Reintentá.");
    }
  }

  useEffect(() => {
    apiFetchAdmin<PaginaProveedores>("/proveedores?pagina=1&limite=20")
      .then(setPagina)
      .catch((causa) => setError(causa instanceof ApiError ? causa.message : "No pudimos cargar proveedores. Reintentá."))
      .finally(() => setCargando(false));
  }, []);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      const proveedor = await apiFetchAdmin<Proveedor>(detalle ? `/proveedores/${detalle.id}` : "/proveedores", {
        method: detalle ? "PUT" : "POST",
        body: JSON.stringify({ nombre, contacto, observaciones }),
      });
      await cargar(pagina?.pagina ?? 1);
      await abrir(proveedor.id);
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos guardar el proveedor. Reintentá.");
    } finally {
      setOcupado(false);
    }
  }

  async function cambiarActividad() {
    if (!detalle || ocupado || !motivo.trim()) return;
    setOcupado(true);
    setError("");
    try {
      await apiFetchAdmin(`/proveedores/${detalle.id}/${detalle.activo ? "desactivacion" : "reactivacion"}`, {
        method: "POST", body: JSON.stringify({ motivo }),
      });
      await cargar(pagina?.pagina ?? 1);
      await abrir(detalle.id);
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cambiar el estado. Consultá el historial y reintentá.");
    } finally {
      setOcupado(false);
    }
  }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
    <section className="border border-black bg-white p-5" aria-labelledby="lista-proveedores">
      <div className="flex items-center justify-between gap-3">
        <h2 id="lista-proveedores" className="font-epilogue text-xl font-black uppercase">Listado</h2>
        <button type="button" className="text-sm underline" onClick={() => { setDetalle(null); setNombre(""); setContacto(""); setObservaciones(""); setMotivo(""); }}>Nuevo</button>
      </div>
      {cargando && <p role="status" className="mt-4 text-sm">Cargando proveedores…</p>}
      {!cargando && pagina?.datos.length === 0 && <p className="mt-4 text-sm text-neutral-600">Aún no hay proveedores.</p>}
      <ul className="mt-4 divide-y divide-neutral-200">
        {pagina?.datos.map((proveedor) => <li key={proveedor.id}>
          <button type="button" onClick={() => abrir(proveedor.id)} className="w-full py-3 text-left hover:underline">
            <span className="font-semibold">{proveedor.nombre}</span>
            <span className="ml-2 text-xs text-neutral-600">{proveedor.activo ? "Activo" : "Inactivo"} · {proveedor._count.ingresos} ingresos</span>
          </button>
        </li>)}
      </ul>
      {pagina && pagina.total > pagina.limite && <div className="mt-4 flex items-center gap-4 text-sm">
        <button type="button" className="underline disabled:opacity-40" disabled={pagina.pagina <= 1 || cargando} onClick={() => cargar(pagina.pagina - 1)}>Anterior</button>
        <span>Página {pagina.pagina}</span>
        <button type="button" className="underline disabled:opacity-40" disabled={pagina.pagina * pagina.limite >= pagina.total || cargando} onClick={() => cargar(pagina.pagina + 1)}>Siguiente</button>
      </div>}
    </section>

    <section className="border border-black bg-white p-5" aria-labelledby="ficha-proveedor">
      <h2 id="ficha-proveedor" className="font-epilogue text-xl font-black uppercase">{detalle ? "Ficha del proveedor" : "Nuevo proveedor"}</h2>
      <form className="mt-5 space-y-4" onSubmit={guardar}>
        <label className="block text-sm font-semibold">Nombre
          <input className={`${campo} mt-1`} value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={200} />
        </label>
        <label className="block text-sm font-semibold">Contacto
          <input className={`${campo} mt-1`} value={contacto} onChange={(e) => setContacto(e.target.value)} maxLength={1000} />
        </label>
        <label className="block text-sm font-semibold">Observaciones
          <textarea className={`${campo} mt-1`} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} maxLength={1000} rows={3} />
        </label>
        <button disabled={ocupado} className="bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{ocupado ? "Guardando…" : "Guardar"}</button>
      </form>
      {detalle && <div className="mt-8 border-t pt-5">
        <h3 className="font-semibold">{detalle.activo ? "Desactivar" : "Reactivar"}</h3>
        <label className="mt-3 block text-sm">Motivo
          <textarea className={`${campo} mt-1`} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} rows={2} />
        </label>
        <button type="button" disabled={ocupado || !motivo.trim()} onClick={cambiarActividad} className="mt-3 border border-black px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {detalle.activo ? "Desactivar proveedor" : "Reactivar proveedor"}
        </button>
        <h3 className="mt-8 font-semibold">Historial de actividad</h3>
        {detalle.eventos.length === 0 ? <p className="mt-2 text-sm text-neutral-600">Sin eventos.</p> : <ul className="mt-2 space-y-2 text-sm">
          {detalle.eventos.map((evento) => <li key={evento.id} className="border-l-2 border-black pl-3">
            <span className="font-semibold capitalize">{evento.tipo}</span> · {new Date(evento.fecha).toLocaleString("es-AR")}<br />{evento.motivo}
          </li>)}
        </ul>}
      </div>}
    </section>
    {error && <div role="alert" className="border border-red-700 bg-red-50 p-4 text-sm text-red-800 lg:col-span-2">{error} <button type="button" className="ml-3 underline" onClick={() => cargar(pagina?.pagina ?? 1)}>Reintentar lista</button></div>}
  </div>;
}
