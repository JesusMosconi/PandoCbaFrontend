"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/categorias", label: "Categorías" },
  { href: "/nosotros", label: "Nosotros" },
];

export default function Header() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

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

        <div className="flex items-center gap-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar"
            aria-label="Buscar productos"
            className="hidden h-[34px] w-32 border border-black bg-transparent px-3 font-manrope text-[10px] font-bold uppercase tracking-widest text-gray-500 outline-none placeholder:text-gray-500 sm:block"
          />
          {/* TODO: conectar búsqueda, carrito y cuenta cuando esas funcionalidades estén disponibles. */}
          <button type="button" aria-label="Carrito" className="hidden text-black sm:block">
            <ShoppingBag size={20} strokeWidth={1.8} />
          </button>
          <button type="button" aria-label="Cuenta" className="hidden text-black sm:block">
            <User size={20} strokeWidth={1.8} />
          </button>
          <button type="button" aria-label="Abrir menú" className="text-black sm:hidden">
            <Menu size={22} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
