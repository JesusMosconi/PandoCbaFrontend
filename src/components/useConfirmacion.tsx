"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type OpcionesConfirmacion = {
  titulo?: string;
  accion?: string;
  destructiva?: boolean;
};

type SolicitudConfirmacion = {
  mensaje: string;
  opciones: OpcionesConfirmacion;
  resolver: (confirmado: boolean) => void;
};

export function useConfirmacion() {
  const [solicitud, setSolicitud] = useState<SolicitudConfirmacion | null>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const solicitudRef = useRef<SolicitudConfirmacion | null>(null);

  const confirmar = useCallback((mensaje: string, opciones: OpcionesConfirmacion = {}) => (
    new Promise<boolean>((resolver) => {
      solicitudRef.current?.resolver(false);
      const nuevaSolicitud = { mensaje, opciones, resolver };
      solicitudRef.current = nuevaSolicitud;
      setSolicitud(nuevaSolicitud);
    })
  ), []);

  const responder = useCallback((confirmado: boolean) => {
    const actual = solicitudRef.current;
    solicitudRef.current = null;
    setSolicitud(null);
    actual?.resolver(confirmado);
  }, []);

  useEffect(() => {
    if (!solicitud) return;

    cancelarRef.current?.focus();
    function manejarTecla(event: KeyboardEvent) {
      if (event.key === "Escape") responder(false);
    }
    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [solicitud, responder]);

  const dialogo = solicitud ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) responder(false);
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        aria-describedby="confirmacion-mensaje"
        className="w-full max-w-md border-2 border-black bg-white p-6 shadow-xl"
      >
        <h2 id="confirmacion-titulo" className="font-epilogue text-xl font-bold uppercase">
          {solicitud.opciones.titulo ?? "Confirmar acción"}
        </h2>
        <p id="confirmacion-mensaje" className="mt-3 text-sm leading-6 text-neutral-700">
          {solicitud.mensaje}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelarRef}
            type="button"
            onClick={() => responder(false)}
            className="border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => responder(true)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-white ${
              solicitud.opciones.destructiva ? "bg-red-700" : "bg-black"
            }`}
          >
            {solicitud.opciones.accion ?? "Confirmar"}
          </button>
        </div>
      </section>
    </div>
  ) : null;

  return { confirmar, dialogo };
}
