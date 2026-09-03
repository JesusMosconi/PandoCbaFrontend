"use client";

import { useEffect, useState } from "react";
import { apiFetchAdmin, ApiError } from "@/lib/api";
import { normalizarRespuestaUsuarios } from "@/lib/usuarios";
import type { UsuarioAdmin, UsuariosAdminRespuesta } from "@/types/usuario";

type Props = { respuestaInicial: UsuariosAdminRespuesta };
type Mensaje = { tipo: "ok" | "error"; texto: string };

const inputClass = "border-2 border-black bg-white px-3 py-2 text-sm";

function fecha(fechaCreado: string | null | undefined) {
  if (!fechaCreado) return "Sin datos";
  const parsed = new Date(fechaCreado);
  if (Number.isNaN(parsed.getTime())) return "Sin datos";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(parsed);
}

export default function AdminClientes({ respuestaInicial }: Props) {
  const [respuesta, setRespuesta] = useState(respuestaInicial);
  const [busqueda, setBusqueda] = useState("");
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState("");
  const [orden, setOrden] = useState("fechaCreado");
  const [direccion, setDireccion] = useState("desc");
  const [pagina, setPagina] = useState(1);
  const [detalle, setDetalle] = useState<UsuarioAdmin | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  useEffect(() => {
    const parametros = new URLSearchParams({ pagina: String(pagina), limite: "20", orden, direccion });
    if (busqueda.trim()) parametros.set("busqueda", busqueda.trim());
    if (rol) parametros.set("rol", rol);
    if (activo) parametros.set("activo", activo);
    let cancelado = false;
    async function cargar() {
      await Promise.resolve();
      if (cancelado) return;
      setCargando(true);
      try {
        const datos = await apiFetchAdmin<unknown>(`/admin/usuarios?${parametros}`);
        if (!cancelado) setRespuesta(normalizarRespuestaUsuarios(datos, pagina));
      } catch (error) {
        if (!cancelado) setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No se pudieron cargar los clientes." });
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [busqueda, rol, activo, orden, direccion, pagina]);

  async function verDetalle(usuario: UsuarioAdmin) {
    try {
      setDetalle(await apiFetchAdmin<UsuarioAdmin>(`/admin/usuarios/${usuario.id}`));
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No se pudo cargar el detalle." });
    }
  }

  async function cambiarEstado(usuario: UsuarioAdmin) {
    if (!window.confirm(`¿Querés ${usuario.activo ? "desactivar" : "activar"} a ${usuario.nombre}?`)) return;
    try {
      const actualizado = await apiFetchAdmin<UsuarioAdmin>(`/admin/usuarios/${usuario.id}/estado`, { method: "PATCH", body: JSON.stringify({ activo: !usuario.activo }) });
      setRespuesta((actual) => ({ ...actual, usuarios: actual.usuarios.map((item) => item.id === usuario.id ? { ...item, activo: actualizado.activo } : item) }));
      setDetalle((actual) => actual?.id === usuario.id ? { ...actual, activo: actualizado.activo } : actual);
      setMensaje({ tipo: "ok", texto: `Usuario ${actualizado.activo ? "activado" : "desactivado"}.` });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No se pudo actualizar el estado." });
    }
  }

  async function cambiarRol(usuario: UsuarioAdmin, nuevoRol: "cliente" | "admin") {
    if (nuevoRol === usuario.rol || !window.confirm("¿Querés cambiar el rol de este usuario?")) return;
    try {
      const actualizado = await apiFetchAdmin<UsuarioAdmin>(`/admin/usuarios/${usuario.id}/rol`, { method: "PUT", body: JSON.stringify({ rol: nuevoRol }) });
      setRespuesta((actual) => ({ ...actual, usuarios: actual.usuarios.map((item) => item.id === usuario.id ? { ...item, rol: actualizado.rol } : item) }));
      setDetalle((actual) => actual?.id === usuario.id ? { ...actual, rol: actualizado.rol } : actual);
      setMensaje({ tipo: "ok", texto: "Rol actualizado." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof ApiError ? error.message : "No se pudo actualizar el rol." });
    }
  }

  return (
    <section>
      <div className="mb-6 grid gap-3 border-y border-black py-5 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <input className={inputClass} value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPagina(1); }} placeholder="Buscar nombre o email" aria-label="Buscar nombre o email" />
        <select className={inputClass} value={rol} onChange={(event) => { setRol(event.target.value); setPagina(1); }} aria-label="Filtrar por rol"><option value="">Todos los roles</option><option value="cliente">Cliente</option><option value="admin">Admin</option></select>
        <select className={inputClass} value={activo} onChange={(event) => { setActivo(event.target.value); setPagina(1); }} aria-label="Filtrar por estado"><option value="">Todos los estados</option><option value="true">Activos</option><option value="false">Inactivos</option></select>
        <select className={inputClass} value={orden} onChange={(event) => setOrden(event.target.value)} aria-label="Ordenar por"><option value="fechaCreado">Registro</option><option value="nombre">Nombre</option><option value="email">Email</option><option value="id">ID</option></select>
        <button className="bg-black px-3 py-2 text-xs font-bold uppercase tracking-wider text-white" onClick={() => setDireccion((actual) => actual === "asc" ? "desc" : "asc")}>Orden: {direccion === "asc" ? "asc" : "desc"}</button>
      </div>
      {mensaje && <p role="status" className={`mb-4 text-sm ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-700"}`}>{mensaje.texto}</p>}
      <div className="overflow-x-auto border-2 border-black bg-white">
        {cargando ? <p className="p-6 text-sm">Cargando clientes...</p> : <table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b-2 border-black bg-black text-xs uppercase tracking-wider text-white"><tr><th className="p-3">ID</th><th className="p-3">Cliente</th><th className="p-3">Email</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Registro</th><th className="p-3">Pedidos</th><th className="p-3">Acciones</th></tr></thead><tbody>{respuesta.usuarios.map((usuario) => <tr key={usuario.id} className="border-b border-neutral-200"><td className="p-3">{usuario.id}</td><td className="p-3 font-bold">{usuario.nombre} {usuario.apellido}</td><td className="p-3">{usuario.email}</td><td className="p-3"><select className="border border-black bg-white px-2 py-1 text-xs" value={usuario.rol} onChange={(event) => cambiarRol(usuario, event.target.value as "cliente" | "admin")} aria-label={`Rol de ${usuario.email}`}><option value="cliente">Cliente</option><option value="admin">Admin</option></select></td><td className="p-3 uppercase">{usuario.activo ? "Activo" : "Inactivo"}</td><td className="p-3">{fecha(usuario.fechaCreado)}</td><td className="p-3">{usuario._count?.ordenes ?? 0}</td><td className="p-3"><div className="flex gap-2"><button className="border border-black px-2 py-1 text-xs font-bold uppercase" onClick={() => verDetalle(usuario)}>Ver</button><button className="border border-black px-2 py-1 text-xs font-bold uppercase" onClick={() => cambiarEstado(usuario)}>{usuario.activo ? "Desactivar" : "Activar"}</button></div></td></tr>)}</tbody></table>}
      </div>
      <div className="flex items-center justify-between py-5 text-sm"><span>{respuesta.total} usuarios</span><div className="flex items-center gap-3"><button className="border border-black px-3 py-2 disabled:opacity-40" disabled={pagina <= 1} onClick={() => setPagina((actual) => actual - 1)}>Anterior</button><span>{pagina} / {Math.max(respuesta.paginas, 1)}</span><button className="border border-black px-3 py-2 disabled:opacity-40" disabled={pagina >= respuesta.paginas} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button></div></div>
      {detalle && <div className="mt-4 border-2 border-black bg-white p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Detalle de cliente</p><h2 className="mt-2 font-epilogue text-3xl font-black uppercase">{detalle.nombre} {detalle.apellido}</h2></div><button className="border border-black px-3 py-2 text-xs font-bold uppercase" onClick={() => setDetalle(null)}>Cerrar</button></div><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="font-bold uppercase text-neutral-500">Email</dt><dd>{detalle.email}</dd></div><div><dt className="font-bold uppercase text-neutral-500">Teléfono</dt><dd>{detalle.telefono || "No informado"}</dd></div><div><dt className="font-bold uppercase text-neutral-500">Rol</dt><dd>{detalle.rol}</dd></div><div><dt className="font-bold uppercase text-neutral-500">Estado</dt><dd>{detalle.activo ? "Activo" : "Inactivo"}</dd></div><div><dt className="font-bold uppercase text-neutral-500">Registro</dt><dd>{fecha(detalle.fechaCreado)}</dd></div><div><dt className="font-bold uppercase text-neutral-500">Pedidos</dt><dd>{detalle._count?.ordenes ?? 0}</dd></div><div><dt className="font-bold uppercase text-neutral-500">Favoritos</dt><dd>{detalle._count?.favoritos ?? 0}</dd></div></dl></div>}
    </section>
  );
}
