"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetchInterna } from "@/lib/api";
import type { Usuario } from "@/types/usuario";

type CuentaPanelProps = {
  usuarioInicial: Usuario;
};

export default function CuentaPanel({ usuarioInicial }: CuentaPanelProps) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(usuarioInicial);
  const [mensajePerfil, setMensajePerfil] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");

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
    } catch (error) {
      setMensajePerfil(error instanceof ApiError ? error.message : "No pudimos actualizar tus datos.");
    }
  }

  async function cambiarPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensajePassword("");
    const datos = new FormData(event.currentTarget);

    try {
      const respuesta = await apiFetchInterna<{ message: string }>("/api/usuarios/cambiar-password", {
        method: "PUT",
        body: JSON.stringify({
          passwordActual: datos.get("passwordActual"),
          passwordNuevo: datos.get("passwordNuevo"),
        }),
      });
      event.currentTarget.reset();
      setMensajePassword(respuesta.message);
    } catch (error) {
      setMensajePassword(error instanceof ApiError ? error.message : "No pudimos actualizar tu contraseña.");
    }
  }

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
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
          <button type="button" onClick={cerrarSesion} className="border border-black px-4 py-3 font-manrope text-xs font-bold uppercase tracking-[0.14em]">Cerrar sesion</button>
        </div>
        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <form onSubmit={actualizarPerfil} className="space-y-5">
            <h2 className="font-epilogue text-2xl font-bold uppercase tracking-[-0.03em]">Tus datos</h2>
            <Input etiqueta="Nombre" nombre="nombre" valor={usuario.nombre} />
            <Input etiqueta="Apellido" nombre="apellido" valor={usuario.apellido} />
            <Input etiqueta="Telefono" nombre="telefono" tipo="tel" valor={usuario.telefono ?? ""} />
            <p className="text-xs leading-5 text-[#6B7280]">El email se mantiene como dato de acceso y no puede editarse desde aqui.</p>
            {mensajePerfil && <p className="text-sm text-[#4C4546]" role="status">{mensajePerfil}</p>}
            <button className="bg-black px-5 py-4 font-manrope text-xs font-bold uppercase tracking-[0.16em] text-white">Guardar cambios</button>
          </form>
          <form onSubmit={cambiarPassword} className="space-y-5 border-t border-black pt-10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <h2 className="font-epilogue text-2xl font-bold uppercase tracking-[-0.03em]">contraseña</h2>
            <Input etiqueta="contraseña actual" nombre="passwordActual" tipo="password" />
            <Input etiqueta="Nueva contraseña" nombre="passwordNuevo" tipo="password" minimo={6} />
            <p className="text-xs leading-5 text-[#6B7280]">Usa una contraseña de al menos 6 caracteres.</p>
            {mensajePassword && <p className="text-sm text-[#4C4546]" role="status">{mensajePassword}</p>}
            <button className="border border-black px-5 py-4 font-manrope text-xs font-bold uppercase tracking-[0.16em]">Actualizar contraseña</button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Input({ etiqueta, nombre, tipo = "text", valor, minimo }: { etiqueta: string; nombre: string; tipo?: string; valor?: string; minimo?: number }) {
  return <div><label htmlFor={nombre} className="mb-2 block font-manrope text-[10px] font-bold uppercase tracking-[0.14em] text-[#4B5563]">{etiqueta}</label><input id={nombre} name={nombre} type={tipo} defaultValue={valor} minLength={minimo} required className="w-full border border-black px-4 py-4 text-sm outline-none focus:ring-1 focus:ring-black" /></div>;
}
