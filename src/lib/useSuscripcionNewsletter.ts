"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

const DURACION_MENSAJE_MS = 6000;

/** Estado y envío compartidos por los formularios de suscripción al newsletter. */
export function useSuscripcionNewsletter() {
  const [email, setEmailState] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // El mensaje se borra solo para que el formulario quede listo para otro intento.
  useEffect(() => {
    if (!message) return;
    const temporizador = setTimeout(() => setMessage(""), DURACION_MENSAJE_MS);
    return () => clearTimeout(temporizador);
  }, [message]);

  function setEmail(valor: string) {
    setEmailState(valor);
    setMessage("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSending(true);

    try {
      await apiFetch("/suscripciones", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setEmailState("");
      setMessage("¡Listo! Te vamos a avisar primero.");
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 409
        ? "Este correo ya está suscripto."
        : "No pudimos registrar tu correo. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return { email, setEmail, message, sending, onSubmit };
}
