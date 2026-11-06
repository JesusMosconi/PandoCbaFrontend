"use client";

import { usePathname } from "next/navigation";

/** La tienda usa un ancho máximo centrado; el panel ocupa todo el ancho para el menú lateral. */
export default function ContenedorPrincipal({ children }: { children: React.ReactNode }) {
  const panel = usePathname().startsWith("/admin");
  return <main className={`w-full flex-1 pt-20 print:pt-0 ${panel ? "" : "mx-auto max-w-[1280px]"}`}>{children}</main>;
}
