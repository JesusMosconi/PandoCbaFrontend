"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetchInterna } from "@/lib/api";
import type { Carrito } from "@/types/carrito";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/categorias", label: "Categorías" },
  { href: "/nosotros", label: "Nosotros" },
];

type HeaderProps = {
  sesionIniciada: boolean;
  esAdmin?: boolean;
};

export default function Header({ sesionIniciada, esAdmin = false }: HeaderProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

  useEffect(() => {
    if (!sesionIniciada) return;

    const cargarCantidadCarrito = () => {
      apiFetchInterna<Carrito>("/api/carrito")
        .then((carrito) => setCantidadCarrito(carrito.items.reduce((total, item) => total + item.cantidad, 0)))
        .catch(() => setCantidadCarrito(0));
    };

    cargarCantidadCarrito();
    window.addEventListener("carrito-actualizado", cargarCantidadCarrito);
    const limpiarCantidadAlCerrarSesion = () => setCantidadCarrito(0);
    window.addEventListener("sesion-cerrada", limpiarCantidadAlCerrarSesion);
    return () => {
      window.removeEventListener("carrito-actualizado", cargarCantidadCarrito);
      window.removeEventListener("sesion-cerrada", limpiarCantidadAlCerrarSesion);
    };
  }, [pathname, sesionIniciada]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-20 border-b-2 border-black bg-white">
      <div className="flex h-full items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Pando CBA, inicio">
          <div className="h-[71px] w-[71px] shrink-0 bg-neutral-200" aria-hidden="true" />
          <span className="font-epilogue text-sm font-black tracking-tighter text-black">PANDO CBA</span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-10 sm:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 py-1 font-epilogue text-xs font-bold uppercase tracking-widest text-black transition-opacity ${
                  active ? "border-black opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          {esAdmin && (
            <Link
              href="/admin"
              className="hidden border border-black bg-black px-3 py-2 font-manrope text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:inline-flex"
            >
              Admin
            </Link>
          )}

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
            aria-label="Buscar productos"
            className="hidden h-[34px] w-32 border border-black bg-transparent px-3 font-manrope text-[10px] font-bold uppercase tracking-widest text-gray-500 outline-none placeholder:text-gray-500 sm:block"
          />
          <Link href={sesionIniciada ? "/carrito" : "/login"} aria-label={`Carrito${cantidadCarrito ? `, ${cantidadCarrito} productos` : ""}`} className="relative hidden text-black sm:block">
            <ShoppingBag size={20} strokeWidth={1.8} />
            {cantidadCarrito > 0 && <span className="absolute -right-3 -top-3 flex h-4 min-w-4 items-center justify-center bg-black px-1 font-manrope text-[9px] font-bold leading-none text-white">{cantidadCarrito}</span>}
          </Link>
          <Link href={sesionIniciada ? "/cuenta" : "/login"} aria-label={sesionIniciada ? "Mi cuenta" : "Ingresar"} className="hidden text-black sm:block">
            <User size={20} strokeWidth={1.8} />
          </Link>
          <button
            type="button"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            aria-controls="menu-mobile"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="text-black sm:hidden"
          >
            {menuAbierto ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav
          id="menu-mobile"
          aria-label="Navegación móvil"
          className="absolute inset-x-0 top-full border-b-2 border-black bg-white px-5 py-6 sm:hidden"
        >
          <div className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAbierto(false)}
                className={`border-b border-black py-4 font-epilogue text-sm font-bold uppercase tracking-widest ${
                  pathname === item.href ? "bg-black px-3 text-white" : "text-black"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {esAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuAbierto(false)}
                className="border-b border-black py-4 font-epilogue text-sm font-bold uppercase tracking-widest text-black"
              >
                Admin
              </Link>
            )}
            <Link
              href={sesionIniciada ? "/cuenta" : "/login"}
              onClick={() => setMenuAbierto(false)}
              className="py-4 font-epilogue text-sm font-bold uppercase tracking-widest text-black"
            >
              {sesionIniciada ? "Mi cuenta" : "Ingresar"}
            </Link>
            <Link
              href={sesionIniciada ? "/carrito" : "/login"}
              onClick={() => setMenuAbierto(false)}
              className="border-t border-black py-4 font-epilogue text-sm font-bold uppercase tracking-widest text-black"
            >
              Carrito{cantidadCarrito > 0 && ` (${cantidadCarrito})`}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
