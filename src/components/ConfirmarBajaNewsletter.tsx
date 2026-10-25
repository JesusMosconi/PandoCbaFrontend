"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type { RespuestaBajaSuscripcion } from "@/types/suscripcion";

type Estado = "inicial" | "enviando" | "confirmada" | "invalida" | "error";

type ConfirmarBajaNewsletterProps = {
  token: string;
};

export default function ConfirmarBajaNewsletter({ token }: ConfirmarBajaNewsletterProps) {
  const [estado, setEstado] = useState<Estado>("inicial");

  async function confirmar() {
    setEstado("enviando");
    try {
      await apiFetch<RespuestaBajaSuscripcion>("/suscripciones/baja", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setEstado("confirmada");
    } catch (error) {
      setEstado(error instanceof ApiError && error.status === 400 ? "invalida" : "error");
    }
  }

  if (estado === "confirmada") {
    return (
      <div>
        <p role="status" className="text-base leading-7 text-[#1A1C1C]">Listo, ya no vas a recibir novedades.</p>
        <VolverAlInicio />
      </div>
    );
  }

  if (estado === "invalida") {
    return (
      <div>
        <p role="status" className="text-base leading-7 text-[#1A1C1C]">El enlace de baja no es válido.</p>
        <VolverAlInicio />
      </div>
    );
  }

  const enviando = estado === "enviando";

  return (
    <div>
      <p className="text-base leading-7 text-[#4C4546]">¿Querés dejar de recibir novedades de PandoCBA?</p>
      <button
        type="button"
        onClick={confirmar}
        disabled={enviando}
        className="mt-8 bg-black px-8 py-4 font-manrope text-xs font-bold uppercase tracking-[0.2em] text-white disabled:opacity-60"
      >
        {enviando ? "Procesando…" : "Confirmar baja"}
      </button>
      {estado === "error" && (
        <p role="status" className="mt-4 text-sm text-[#4C4546]">No pudimos procesar la baja. Intentá de nuevo.</p>
      )}
    </div>
  );
}

function VolverAlInicio() {
  return (
    <Link href="/" className="mt-8 inline-block border border-black px-8 py-4 font-manrope text-xs font-bold uppercase tracking-[0.2em] text-black">
      Volver al inicio
    </Link>
  );
}
