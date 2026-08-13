"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ApiError, apiFetchInterna } from "@/lib/api";
import type { Usuario } from "@/types/usuario";

type Modo = "login" | "registro";

export default function AuthForm() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("login");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setMensaje("");

    const datos = new FormData(event.currentTarget);
    const body = modo === "login"
      ? { email: datos.get("email"), password: datos.get("password") }
      : {
          nombre: datos.get("nombre"),
          apellido: datos.get("apellido"),
          email: datos.get("email"),
          telefono: datos.get("telefono") || undefined,
          password: datos.get("password"),
        };

    try {
      await apiFetchInterna<{ usuario: Usuario }>(`/api/auth/${modo}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push("/cuenta");
      router.refresh();
    } catch (error) {
      setMensaje(error instanceof ApiError ? error.message : "No pudimos procesar tu solicitud. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function cambiarModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setMensaje("");
  }

  return (
    <section className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      <div className="hidden bg-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="font-epilogue text-lg font-black tracking-tighter">PANDO CBA</Link>
        <div>
          <p className="font-manrope text-xs font-bold uppercase tracking-[0.3em] text-[#9CA3AF]">Archivo personal</p>
          <h1 className="mt-5 max-w-md font-epilogue text-6xl font-bold uppercase leading-[0.9] tracking-[-0.05em]">Tu próximo drop empieza acá.</h1>
          <p className="mt-7 max-w-sm text-sm leading-6 text-[#B7B7B7]">Guardá tus datos y mantenete cerca de las próximas piezas.</p>
        </div>
        <p className="font-manrope text-[10px] uppercase tracking-[0.25em] text-[#9CA3AF]">Pando CBA — Córdoba, Argentina</p>
      </div>

      <div className="flex items-center justify-center px-6 py-14 sm:px-12">
        <div className="w-full max-w-md">
          <Link href="/" className="font-epilogue text-sm font-black tracking-tighter lg:hidden">PANDO CBA</Link>
          <p className="mt-10 font-manrope text-[10px] font-bold uppercase tracking-[0.28em] text-[#6B7280]">Mi cuenta</p>
          <h2 className="mt-3 font-epilogue text-4xl font-bold uppercase tracking-[-0.04em] text-[#1A1C1C]">
            {modo === "login" ? "Bienvenido de nuevo" : "Creá tu cuenta"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            {modo === "login" ? "Ingresá para continuar explorando el archivo." : "Completá tus datos y sé parte del próximo drop."}
          </p>

          <div className="mt-8 grid grid-cols-2 border-b border-black">
            {(["login", "registro"] as Modo[]).map((opcion) => (
              <button key={opcion} type="button" onClick={() => cambiarModo(opcion)} className={`border-b-2 pb-3 font-manrope text-xs font-bold uppercase tracking-[0.15em] ${modo === opcion ? "border-black text-black" : "border-transparent text-[#9CA3AF]"}`}>
                {opcion === "login" ? "Ingresar" : "Registrarme"}
              </button>
            ))}
          </div>

          <form className="mt-8 space-y-5" onSubmit={enviarFormulario}>
            {modo === "registro" && <div className="grid gap-5 sm:grid-cols-2">
              <Campo etiqueta="Nombre" nombre="nombre" autoComplete="given-name" />
              <Campo etiqueta="Apellido" nombre="apellido" autoComplete="family-name" />
            </div>}
            <Campo etiqueta="Correo electrónico" nombre="email" tipo="email" autoComplete="email" />
            {modo === "registro" && <Campo etiqueta="Teléfono (opcional)" nombre="telefono" tipo="tel" autoComplete="tel" requerido={false} />}
            <div>
              <label htmlFor="password" className="mb-2 block font-manrope text-[10px] font-bold uppercase tracking-[0.14em] text-[#4B5563]">Contraseña</label>
              <div className="flex border border-black focus-within:ring-1 focus-within:ring-black">
                <input id="password" name="password" type={mostrarPassword ? "text" : "password"} minLength={6} autoComplete={modo === "login" ? "current-password" : "new-password"} required className="min-w-0 flex-1 px-4 py-4 text-sm outline-none" placeholder={modo === "registro" ? "Mínimo 6 caracteres" : "Tu contraseña"} />
                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="px-4 text-[#4B5563]" aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {mensaje && <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{mensaje}</p>}
            <button type="submit" disabled={enviando} className="w-full bg-black px-5 py-4 font-manrope text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60">
              {enviando ? "Procesando..." : modo === "login" ? "Ingresar" : "Crear mi cuenta"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Campo({ etiqueta, nombre, tipo = "text", autoComplete, requerido = true }: { etiqueta: string; nombre: string; tipo?: string; autoComplete?: string; requerido?: boolean }) {
  return <div><label htmlFor={nombre} className="mb-2 block font-manrope text-[10px] font-bold uppercase tracking-[0.14em] text-[#4B5563]">{etiqueta}</label><input id={nombre} name={nombre} type={tipo} autoComplete={autoComplete} required={requerido} className="w-full border border-black px-4 py-4 text-sm outline-none focus:ring-1 focus:ring-black" /></div>;
}
