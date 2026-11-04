"use client";

import { Printer } from "lucide-react";

export default function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
      <Printer size={14} aria-hidden /> Imprimir
    </button>
  );
}
