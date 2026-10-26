"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiFetchAdmin } from "@/lib/api";
import { useConfirmacion } from "@/components/useConfirmacion";
import type { DropAdmin, MarcaInicio } from "@/types/drop";

type Formulario = { nombre: string; numeroDrop: string; tituloInicio: string; textoBotonInicio: string; fechaLanzamiento: string; fechaFinalizacion: string };
const vacio: Formulario = { nombre: "", numeroDrop: "", tituloInicio: "", textoBotonInicio: "", fechaLanzamiento: "", fechaFinalizacion: "" };
const zona = "America/Argentina/Buenos_Aires";

function fechaLocal(fecha: string | null) {
  return fecha ? new Date(new Date(fecha).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16) : "";
}

function instante(valor: string) {
  return valor ? new Date(`${valor}:00-03:00`).toISOString() : null;
}

function formularioDrop(drop: DropAdmin): Formulario {
  return { nombre: drop.nombre, numeroDrop: drop.numeroDrop?.toString() ?? "",
    tituloInicio: drop.tituloInicio ?? "", textoBotonInicio: drop.textoBotonInicio ?? "",
    fechaLanzamiento: fechaLocal(drop.fechaLanzamiento), fechaFinalizacion: fechaLocal(drop.fechaFinalizacion) };
}

export default function AdminDrops() {
  const [drops, setDrops] = useState<DropAdmin[]>([]);
  const [marca, setMarca] = useState<MarcaInicio | null>(null);
  const [form, setForm] = useState<Formulario>(vacio);
  const [editando, setEditando] = useState<number | null>(null);
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenMarca, setImagenMarca] = useState<File | null>(null);
  const vistaImagen = useMemo(() => imagen ? URL.createObjectURL(imagen) : null, [imagen]);
  const vistaMarca = useMemo(() => imagenMarca ? URL.createObjectURL(imagenMarca) : null, [imagenMarca]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const { confirmar, dialogo } = useConfirmacion();

  const cargar = useCallback(async () => {
    const [listado, configuracion] = await Promise.all([
      apiFetchAdmin<DropAdmin[]>("/drops"), apiFetchAdmin<MarcaInicio>("/drops/marca"),
    ]);
    setDrops(listado);
    setMarca(configuracion);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => void cargar().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : "No se pudieron cargar los drops")), 0);
    return () => clearTimeout(temporizador);
  }, [cargar]);
  useEffect(() => () => { if (vistaImagen) URL.revokeObjectURL(vistaImagen); }, [vistaImagen]);
  useEffect(() => () => { if (vistaMarca) URL.revokeObjectURL(vistaMarca); }, [vistaMarca]);

  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true); setError(""); setAviso("");
    try { await accion(); await cargar(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el cambio"); }
    finally { setOcupado(false); }
  }

  async function subirImagen(id: number, archivo: File) {
    const datos = new FormData(); datos.set("imagen", archivo);
    await apiFetchAdmin(`/drops/${id}/imagen`, { method: "POST", body: datos });
  }

  async function guardarDrop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ejecutar(async () => {
      const campos = { nombre: form.nombre.trim(), numeroDrop: form.numeroDrop ? Number(form.numeroDrop) : null,
        tituloInicio: form.tituloInicio.trim() || null, textoBotonInicio: form.textoBotonInicio.trim() || null,
        fechaLanzamiento: instante(form.fechaLanzamiento), fechaFinalizacion: instante(form.fechaFinalizacion) };
      if (!campos.nombre) throw new Error("Ingresá el nombre del drop");
      const portadaDisponible = editando ? Boolean(drops.find((drop) => drop.id === editando)?.imagenUrl) : Boolean(imagen);
      if (campos.fechaLanzamiento && (!campos.tituloInicio || !campos.textoBotonInicio || !portadaDisponible)) throw new Error("Para programar necesitás portada, título y botón");
      if (campos.fechaFinalizacion && (!campos.fechaLanzamiento || campos.fechaFinalizacion <= campos.fechaLanzamiento)) throw new Error("La finalización debe ser posterior al lanzamiento");
      if (editando) {
        if (imagen) throw new Error("Subí la portada con su botón antes de guardar los textos y fechas");
        await apiFetchAdmin(`/drops/${editando}`, { method: "PUT", body: JSON.stringify(campos) });
      } else {
        const { fechaLanzamiento, fechaFinalizacion, ...borrador } = campos;
        const nuevo = await apiFetchAdmin<DropAdmin>("/drops", { method: "POST", body: JSON.stringify(borrador) });
        if (imagen) await subirImagen(nuevo.id, imagen);
        if (fechaLanzamiento || fechaFinalizacion) await apiFetchAdmin(`/drops/${nuevo.id}`, { method: "PUT", body: JSON.stringify({ fechaLanzamiento, fechaFinalizacion }) });
      }
      setForm(vacio); setEditando(null); setImagen(null);
      setAviso("Drop guardado correctamente.");
    });
  }

  async function actualizarPortada() {
    if (!editando || !imagen) return;
    await ejecutar(async () => { await subirImagen(editando, imagen); setImagen(null); setAviso("Portada guardada."); });
  }

  async function finalizar(id: number) {
    if (!await confirmar("¿Finalizar este drop ahora? No se activará de nuevo automáticamente.", { accion: "Finalizar", destructiva: true })) return;
    await ejecutar(async () => { await apiFetchAdmin(`/drops/${id}/finalizar`, { method: "POST" }); setAviso("Drop finalizado."); });
  }

  async function retirar(id: number) {
    if (!await confirmar("¿Retirar este drop? Su historial y productos se conservarán.", { accion: "Retirar", destructiva: true })) return;
    await ejecutar(async () => { await apiFetchAdmin(`/drops/${id}`, { method: "DELETE" }); setAviso("Drop retirado."); });
  }

  async function quitarPortada(id: number) {
    if (!await confirmar("¿Eliminar la portada de este borrador?", { accion: "Eliminar", destructiva: true })) return;
    await ejecutar(async () => { await apiFetchAdmin(`/drops/${id}/imagen`, { method: "DELETE" }); setAviso("Portada eliminada."); });
  }

  async function quitarImagenMarca() {
    if (!await confirmar("¿Eliminar la imagen de marca?", { accion: "Eliminar", destructiva: true })) return;
    await ejecutar(async () => { await apiFetchAdmin("/drops/marca/imagen", { method: "DELETE" }); setAviso("Imagen de marca eliminada."); });
  }

  async function subirImagenMarca() {
    if (!imagenMarca) return;
    await ejecutar(async () => {
      const datos = new FormData(); datos.set("imagen", imagenMarca);
      await apiFetchAdmin("/drops/marca/imagen", { method: "POST", body: datos });
      setImagenMarca(null); setAviso("Imagen de marca guardada.");
    });
  }

  return <div className="mt-10 space-y-12">
    {error && <p role="alert" className="border border-red-700 bg-red-50 p-4 text-red-800">{error}</p>}
    {aviso && <p role="status" className="border border-green-700 bg-green-50 p-4 text-green-800">{aviso}</p>}

    <section className="border border-black bg-white p-6">
      <h2 className="font-epilogue text-2xl font-bold uppercase">{editando ? `Editar drop #${editando}` : "Nuevo drop"}</h2>
      <p className="mt-2 text-sm text-neutral-600">Horario de lanzamiento y fin: {zona}. Podés guardar un borrador sin fecha y programarlo después.</p>
      <form onSubmit={guardarDrop} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm">Nombre<input required maxLength={200} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 w-full border border-black p-3" /></label>
        <label className="text-sm">Número de drop<input type="number" min="1" value={form.numeroDrop} onChange={(e) => setForm({ ...form, numeroDrop: e.target.value })} className="mt-1 w-full border border-black p-3" /></label>
        <label className="text-sm">Título de Inicio<input maxLength={200} value={form.tituloInicio} onChange={(e) => setForm({ ...form, tituloInicio: e.target.value })} className="mt-1 w-full border border-black p-3" /></label>
        <label className="text-sm">Texto del botón<input maxLength={200} value={form.textoBotonInicio} onChange={(e) => setForm({ ...form, textoBotonInicio: e.target.value })} className="mt-1 w-full border border-black p-3" /></label>
        <label className="text-sm">Lanzamiento<input type="datetime-local" value={form.fechaLanzamiento} onChange={(e) => setForm({ ...form, fechaLanzamiento: e.target.value })} className="mt-1 w-full border border-black p-3" /></label>
        <label className="text-sm">Finalización opcional<input type="datetime-local" value={form.fechaFinalizacion} onChange={(e) => setForm({ ...form, fechaFinalizacion: e.target.value })} className="mt-1 w-full border border-black p-3" /></label>
        <label className="text-sm md:col-span-2">Portada<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => setImagen(e.target.files?.[0] ?? null)} className="mt-1 block w-full border border-black p-3" /></label>
        {vistaImagen && <img src={vistaImagen} alt="Vista previa de portada" className="h-48 w-full object-cover md:col-span-2" />}
        {editando && drops.find((drop) => drop.id === editando)?.imagenUrl && !imagen && <img src={drops.find((drop) => drop.id === editando)?.imagenUrl ?? ""} alt="Portada actual" className="h-48 w-full object-cover md:col-span-2" />}
        <div className="flex gap-3 md:col-span-2"><button disabled={ocupado} className="bg-black px-6 py-3 text-xs font-bold uppercase text-white disabled:opacity-50">{ocupado ? "Guardando..." : "Guardar datos"}</button>{editando && imagen && <button type="button" disabled={ocupado} onClick={() => void actualizarPortada()} className="border border-black px-6 py-3 text-xs font-bold uppercase disabled:opacity-50">Subir portada</button>}{editando && <button type="button" onClick={() => { setEditando(null); setForm(vacio); setImagen(null); }} className="border border-black px-6 py-3 text-xs font-bold uppercase">Cancelar edición</button>}</div>
      </form>
    </section>

    <section><h2 className="font-epilogue text-2xl font-bold uppercase">Drops cargados</h2>
      <div className="mt-5 space-y-4">{drops.map((drop) => <article key={drop.id} className="flex flex-col gap-4 border border-black bg-white p-5 md:flex-row md:items-center">
        {drop.imagenUrl && <img src={drop.imagenUrl} alt="" className="h-24 w-full object-cover md:w-40" />}
        <div className="flex-1"><h3 className="font-epilogue text-xl font-bold uppercase">{drop.nombre}</h3><p className="text-sm">Estado: <strong>{drop.estado}</strong>{drop.motivoEstado ? ` · ${drop.motivoEstado}` : ""}</p><p className="text-sm">Productos disponibles: {drop.productosDisponibles} · Inicio: {drop.fechaLanzamiento ? new Date(drop.fechaLanzamiento).toLocaleString("es-AR", { timeZone: zona }) : "sin programar"}{drop.fechaFinalizacion ? ` · Fin: ${new Date(drop.fechaFinalizacion).toLocaleString("es-AR", { timeZone: zona })}` : ""}</p><Link href="/admin/productos" className="text-sm underline">Asignar productos</Link></div>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={ocupado || !drop.activo || Boolean(drop.fechaCierre)} onClick={() => { setEditando(drop.id); setForm(formularioDrop(drop)); setImagen(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="border border-black px-3 py-2 text-xs font-bold uppercase disabled:opacity-40">Editar</button>{drop.imagenUrl && !drop.fechaLanzamiento && <button type="button" disabled={ocupado} onClick={() => void quitarPortada(drop.id)} className="border border-black px-3 py-2 text-xs font-bold uppercase disabled:opacity-40">Quitar portada</button>}<button type="button" disabled={ocupado || !drop.activo || !drop.fechaLanzamiento || new Date(drop.fechaLanzamiento) > new Date() || Boolean(drop.fechaCierre)} onClick={() => void finalizar(drop.id)} className="border border-black px-3 py-2 text-xs font-bold uppercase disabled:opacity-40">Finalizar ahora</button><button type="button" disabled={ocupado || !drop.activo} onClick={() => void retirar(drop.id)} className="border border-red-700 px-3 py-2 text-xs font-bold uppercase text-red-700 disabled:opacity-40">Retirar</button></div>
      </article>)}{!drops.length && <p className="text-sm text-neutral-600">Todavía no hay drops cargados.</p>}</div>
    </section>

    <section className="border border-black bg-white p-6"><h2 className="font-epilogue text-2xl font-bold uppercase">Portada sin drop</h2><p className="mt-2 text-sm text-neutral-600">Se mostrará cuando no haya un drop activo ni uno próximo con fecha. La imagen ya incluye el mensaje; Inicio no superpone otro título.</p>
      <div className="mt-5 space-y-4"><label className="block text-sm">Imagen o logo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => setImagenMarca(e.target.files?.[0] ?? null)} className="mt-1 block w-full border border-black p-3" /></label>{(vistaMarca || marca?.imagenUrl) && <img src={vistaMarca ?? marca?.imagenUrl ?? ""} alt="Vista previa de marca" className="h-56 w-full object-contain bg-black" />}<p className="text-sm">{marca?.completo ? "Configuración completa" : "Falta subir una imagen antes de publicar la nueva portada"}</p>{imagenMarca && <button type="button" disabled={ocupado} onClick={() => void subirImagenMarca()} className="border border-black px-6 py-3 text-xs font-bold uppercase disabled:opacity-50">Subir imagen/logo</button>}{marca?.imagenUrl && !marca.completo && <button type="button" disabled={ocupado} onClick={() => void quitarImagenMarca()} className="border border-red-700 px-6 py-3 text-xs font-bold uppercase text-red-700 disabled:opacity-50">Eliminar imagen</button>}</div>
    </section>
    {dialogo}
  </div>;
}
