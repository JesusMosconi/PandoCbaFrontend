"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShieldCheck, X, type LucideIcon } from "lucide-react";
import { GRUPOS_ADMIN, INICIO_ADMIN, PUNTO_VENTA } from "@/lib/admin-modulos";

/** Una ruta está activa si es la misma o una subruta (p. ej. /admin/productos/12). Inicio solo coincide exacto. */
function estaActiva(ruta: string, href: string) {
  return href === "/admin" ? ruta === "/admin" : ruta === href || ruta.startsWith(`${href}/`);
}

function Enlace({ href, titulo, icono: Icono, activa, onNavegar }: {
  href: string; titulo: string; icono: LucideIcon; activa: boolean; onNavegar: () => void;
}) {
  return <Link href={href} onClick={onNavegar} aria-current={activa ? "page" : undefined}
    className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-colors ${
      activa ? "bg-black text-white" : "text-black hover:bg-neutral-200"}`}>
    <Icono className="h-4 w-4 shrink-0" aria-hidden />
    <span>{titulo}</span>
  </Link>;
}

export default function AdminSidebar() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  const menu = <nav aria-label="Menú del panel" className="space-y-6 p-4">
    <Enlace {...INICIO_ADMIN} activa={estaActiva(ruta, INICIO_ADMIN.href)} onNavegar={cerrar} />
    {GRUPOS_ADMIN.map((grupo) => <div key={grupo.titulo}>
      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">{grupo.titulo}</p>
      <ul className="mt-2 space-y-1">
        {grupo.modulos.map((modulo) => <li key={modulo.href}>
          <Enlace {...modulo} activa={estaActiva(ruta, modulo.href)} onNavegar={cerrar} />
        </li>)}
      </ul>
    </div>)}
    <div className="border-t border-black pt-4">
      <Enlace {...PUNTO_VENTA} activa={false} onNavegar={cerrar} />
    </div>
  </nav>;

  return <>
    {/* Escritorio: columna fija que acompaña el scroll. */}
    <aside className="hidden w-60 shrink-0 border-r border-black bg-white lg:block print:hidden">
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
        <p className="flex items-center gap-2 border-b border-black px-7 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />Panel
        </p>
        {menu}
      </div>
    </aside>

    {/* Móvil y tablet: botón que despliega el menú. */}
    <div className="border-b border-black bg-white lg:hidden print:hidden">
      <button type="button" onClick={() => setAbierto((valor) => !valor)} aria-expanded={abierto}
        aria-controls="menu-admin-movil"
        className="flex w-full items-center justify-between px-5 py-3 text-xs font-bold uppercase tracking-[0.25em]">
        <span>Menú del panel</span>
        {abierto ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
      </button>
      {abierto && <div id="menu-admin-movil" className="border-t border-black">{menu}</div>}
    </div>
  </>;
}
