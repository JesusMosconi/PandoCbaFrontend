"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ApiError, apiFetchInterna } from "@/lib/api";
import type { Usuario } from "@/types/usuario";
import MisOrdenes from "@/components/MisOrdenes";

type CuentaPanelProps = {
  usuarioInicial: Usuario;
  mostrarOrdenes: boolean;
};

export default function CuentaPanel({ usuarioInicial, mostrarOrdenes }: CuentaPanelProps) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(usuarioInicial);
  const [mensajePerfil, setMensajePerfil] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");
  const [mensajeSesion, setMensajeSesion] = useState("");
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [vista, setVista] = useState<"inicio" | "datos" | "password" | "ordenes">("inicio");

  useEffect(() => {
    if (!mostrarOrdenes || !new URLSearchParams(window.location.search).has("orden")) return;
    const temporizador = window.setTimeout(() => setVista("ordenes"), 0);
    return () => window.clearTimeout(temporizador);
  }, [mostrarOrdenes]);

  function volverInicio() {
    const parametros = new URLSearchParams(window.location.search);
    parametros.delete("orden");
    const consulta = parametros.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${consulta ? `?${consulta}` : ""}`);
    setVista("inicio");
  }

  async function actualizarPerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajePerfil("");
    const datos = new FormData(event.currentTarget);

    try {
      const perfil = await apiFetchInterna<Usuario>("/api/usuarios/perfil", {
        method: "PUT",
        body: JSON.stringify({
          nombre: datos.get("nombre"),
          apellido: datos.get("apellido"),
          telefono: datos.get("telefono") || null,
        }),
      });
      setUsuario(perfil);
      setMensajePerfil("Tus datos fueron actualizados.");
      setVista("inicio");
    } catch (error) {
      setMensajePerfil(error instanceof ApiError ? error.message : "No pudimos actualizar tus datos.");
    }
  }

  async function cambiarPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajePassword("");
    // Guardar el formulario antes del await: React vacía event.currentTarget al terminar el evento.
    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    try {
      const respuesta = await apiFetchInterna<{ message: string }>("/api/usuarios/cambiar-password", {
        method: "PUT",
        body: JSON.stringify({
          passwordActual: datos.get("passwordActual"),
          passwordNuevo: datos.get("passwordNuevo"),
        }),
      });
      formulario.reset();
      setMensajePassword(respuesta.message);
      setVista("inicio");
    } catch (error) {
      setMensajePassword(error instanceof ApiError ? error.message : "No pudimos actualizar tu contraseña.");
    }
  }

  async function cerrarSesion() {
    setCerrandoSesion(true);
    setMensajeSesion("");
    try {
      const respuesta = await fetch("/api/auth/logout", { method: "POST" });
      if (!respuesta.ok) throw new Error("No pudimos cerrar la sesión. Intentá de nuevo.");
      window.dispatchEvent(new Event("sesion-cerrada"));
      router.push("/");
      router.refresh();
    } catch {
      setMensajeSesion("No pudimos cerrar la sesión. Intentá de nuevo.");
      setCerrandoSesion(false);
    }
  }

  return (
    <section className="px-6 py-14 sm:px-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="font-manrope text-[10px] font-bold uppercase tracking-[0.28em] text-[#6B7280]">Mi cuenta</p>
        <div className="mt-3 flex flex-col gap-5 border-b-2 border-black pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-epilogue text-4xl font-bold uppercase tracking-[-0.04em]">Hola, {usuario.nombre}</h1>
            <p className="mt-2 text-sm text-[#6B7280]">{usuario.email}</p>
          </div>
          <div className="sm:text-right">
            <button type="button" disabled={cerrandoSesion} onClick={cerrarSesion} className="border border-black px-4 py-3 font-manrope text-xs font-bold uppercase tracking-[0.14em] disabled:cursor-wait disabled:opacity-60">
              {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
            {mensajeSesion && <p className="mt-2 text-sm text-red-700" role="alert">{mensajeSesion}</p>}
          </div>
        </div>
        {vista === "inicio" && <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mostrarOrdenes && <button type="button" onClick={() => setVista("ordenes")} className="border border-black p-6 text-left font-epilogue text-lg font-bold uppercase hover:bg-neutral-100">Mis órdenes</button>}
          <button type="button" onClick={() => setVista("datos")} className="border border-black p-6 text-left font-epilogue text-lg font-bold uppercase hover:bg-neutral-100">Editar mis datos</button>
          <button type="button" onClick={() => setVista("password")} className="border border-black p-6 text-left font-epilogue text-lg font-bold uppercase hover:bg-neutral-100">Cambiar contraseña</button>
        </div>}
        {vista !== "inicio" && <button type="button" onClick={volverInicio} className="mt-8 text-sm font-semibold underline">Volver a mi cuenta</button>}
        {vista === "datos" && <div className="mt-8 max-w-xl">
          <form onSubmit={actualizarPerfil} className="space-y-5">
            <h2 className="font-epilogue text-2xl font-bold uppercase tracking-[-0.03em]">Tus datos</h2>
            <Input etiqueta="Nombre" nombre="nombre" valor={usuario.nombre} />
            <Input etiqueta="Apellido" nombre="apellido" valor={usuario.apellido} />
            <Input etiqueta="Telefono" nombre="telefono" tipo="tel" valor={usuario.telefono ?? ""} />
            <p className="text-xs leading-5 text-[#6B7280]">El email se mantiene como dato de acceso y no puede editarse desde aqui.</p>
            {mensajePerfil && <p className="text-sm text-[#4C4546]" role="status">{mensajePerfil}</p>}
            <button className="bg-black px-5 py-4 font-manrope text-xs font-bold uppercase tracking-[0.16em] text-white">Guardar cambios</button>
          </form>
        </div>}
        {vista === "password" && <div className="mt-8 max-w-xl">
          <form onSubmit={cambiarPassword} className="space-y-5">
            <h2 className="font-epilogue text-2xl font-bold uppercase tracking-[-0.03em]">contraseña</h2>
            <InputPassword etiqueta="Contraseña actual" nombre="passwordActual" autoComplete="current-password" />
            <InputPassword etiqueta="Nueva contraseña" nombre="passwordNuevo" autoComplete="new-password" minimo={6} />
            <p className="text-xs leading-5 text-[#6B7280]">Usa una contraseña de al menos 6 caracteres.</p>
            {mensajePassword && <p className="text-sm text-[#4C4546]" role="status">{mensajePassword}</p>}
            <button className="border border-black px-5 py-4 font-manrope text-xs font-bold uppercase tracking-[0.16em]">Actualizar contraseña</button>
          </form>
        </div>}
        {vista === "inicio" && (mensajePerfil || mensajePassword) && <p className="mt-6 text-sm" role="status">{mensajePerfil || mensajePassword}</p>}
        {mostrarOrdenes && vista === "ordenes" && <MisOrdenes />}
      </div>
    </section>
  );
}

function Input({ etiqueta, nombre, tipo = "text", valor, minimo }: { etiqueta: string; nombre: string; tipo?: string; valor?: string; minimo?: number }) {
  return <div><label htmlFor={nombre} className="mb-2 block font-manrope text-[10px] font-bold uppercase tracking-[0.14em] text-[#4B5563]">{etiqueta}</label><input id={nombre} name={nombre} type={tipo} defaultValue={valor} minLength={minimo} required className="w-full border border-black px-4 py-4 text-sm outline-none focus:ring-1 focus:ring-black" /></div>;
}

/** Campo de contraseña con botón para mostrarla u ocultarla (igual que en el login). */
function InputPassword({ etiqueta, nombre, autoComplete, minimo }: { etiqueta: string; nombre: string; autoComplete: string; minimo?: number }) {
  const [visible, setVisible] = useState(false);
  return <div>
    <label htmlFor={nombre} className="mb-2 block font-manrope text-[10px] font-bold uppercase tracking-[0.14em] text-[#4B5563]">{etiqueta}</label>
    <div className="flex border border-black focus-within:ring-1 focus-within:ring-black">
      <input id={nombre} name={nombre} type={visible ? "text" : "password"} minLength={minimo} autoComplete={autoComplete} required
        className="min-w-0 flex-1 px-4 py-4 text-sm outline-none" />
      <button type="button" onClick={() => setVisible(!visible)} className="px-4 text-[#4B5563] hover:text-black"
        aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`} aria-pressed={visible}>
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  </div>;
}
