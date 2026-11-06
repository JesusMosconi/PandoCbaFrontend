"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/vendedor", etiqueta: "Venta" },
  { href: "/vendedor/caja", etiqueta: "Caja" },
  { href: "/vendedor/ventas", etiqueta: "Ventas" },
];

export default function NavegacionVendedor() {
  const pathname = usePathname();
  return (
    <nav aria-label="Punto de venta" className="flex border-2 border-black">
      {enlaces.map((enlace) => {
        const activo = enlace.href === "/vendedor" ? pathname === "/vendedor" : pathname.startsWith(enlace.href);
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            aria-current={activo ? "page" : undefined}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${activo ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"}`}
          >
            {enlace.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
