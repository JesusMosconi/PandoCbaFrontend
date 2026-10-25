"use client";

import { useSuscripcionNewsletter } from "@/lib/useSuscripcionNewsletter";

type NewsletterFormProps = {
  variant?: "compact" | "light" | "dark";
};

export default function NewsletterForm({ variant = "compact" }: NewsletterFormProps) {
  const { email, setEmail, message, sending, onSubmit } = useSuscripcionNewsletter();

  const light = variant === "light";
  const dark = variant === "dark";

  return (
    <form onSubmit={onSubmit} className={light ? "w-full border-b border-black" : dark ? "w-full border border-white" : "max-w-md border-b-2 border-black pb-2"}>
      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="newsletter-email">Correo electrónico</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={light ? "Correo Electrónico" : "CORREO ELECTRÓNICO"}
          required
          className={light
            ? "min-w-0 flex-1 bg-transparent py-4 font-manrope text-base text-black outline-none placeholder:text-[#939393]"
            : dark
              ? "min-w-0 flex-1 bg-transparent px-4 py-4 font-manrope text-xs font-bold tracking-[0.1em] text-white outline-none placeholder:text-[#6B7280]"
            : "min-w-0 flex-1 bg-transparent py-2 font-epilogue text-xs font-bold tracking-[0.1em] text-black outline-none placeholder:text-[#6B7280]"}
        />
        <button type="submit" disabled={sending} className={light
          ? "shrink-0 bg-black px-4 py-4 font-manrope text-xs font-normal uppercase tracking-[0.1em] text-white disabled:opacity-60 sm:px-12 sm:text-base"
          : dark
            ? "shrink-0 bg-white px-4 py-4 font-manrope text-xs font-bold uppercase tracking-[0.1em] text-black disabled:opacity-60 sm:px-8"
          : "shrink-0 border border-black/65 px-3 py-2 font-epilogue text-xs font-bold uppercase tracking-[0.1em] disabled:opacity-60"}>
          {sending ? "ENVIANDO" : "ENTERARME PRIMERO"}
        </button>
      </div>
      {message && <p className={`pt-3 text-sm ${dark ? "text-white" : "text-[#4C4546]"}`} role="status">{message}</p>}
    </form>
  );
}
