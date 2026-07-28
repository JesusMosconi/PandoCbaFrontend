"use client";

import { FormEvent, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSending(true);

    try {
      await apiFetch("/suscripciones", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setEmail("");
      setMessage("¡Listo! Te vamos a avisar primero.");
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 409
        ? "Este correo ya está suscripto."
        : "No pudimos registrar tu correo. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md border-b-2 border-black pb-2">
      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="newsletter-email">Correo electrónico</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="CORREO ELECTRÓNICO"
          required
          className="min-w-0 flex-1 bg-transparent py-2 font-epilogue text-xs font-bold tracking-[0.1em] text-black outline-none placeholder:text-[#6B7280]"
        />
        <button type="submit" disabled={sending} className="shrink-0 border border-black/65 px-3 py-2 font-epilogue text-xs font-bold uppercase tracking-[0.1em] disabled:opacity-60">
          {sending ? "ENVIANDO" : "ENTERARME PRIMERO"}
        </button>
      </div>
      {message && <p className="pt-3 text-sm text-[#4C4546]" role="status">{message}</p>}
    </form>
  );
}
