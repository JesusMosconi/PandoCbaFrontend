"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError, apiFetchInterna } from "@/lib/api";
import type { Carrito } from "@/types/carrito";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function CarritoPanel() {
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [mensajesStock, setMensajesStock] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiFetchInterna<Carrito>("/api/carrito")
      .then(setCarrito)
      .catch((error) => setMensaje(error instanceof ApiError ? error.message : "No pudimos cargar tu carrito"))
      .finally(() => setCargando(false));
  }, []);

  async function actualizarItem(id: number, cantidad: number) {
    try {
      setCarrito(await apiFetchInterna<Carrito>(`/api/carrito/items/${id}`, { method: "PUT", body: JSON.stringify({ cantidad }) }));
      setMensajesStock((actuales) => ({ ...actuales, [id]: "" }));
      window.dispatchEvent(new Event("carrito-actualizado"));
    } catch (error) {
      if (error instanceof ApiError && error.message.toLowerCase() === "stock insuficiente") {
        setMensajesStock((actuales) => ({ ...actuales, [id]: "Stock Insuficiente" }));
      } else {
        setMensaje(error instanceof ApiError ? error.message : "No pudimos actualizar el carrito");
      }
    }
  }

  async function eliminarItem(id: number) {
    try {
      setCarrito(await apiFetchInterna<Carrito>(`/api/carrito/items/${id}`, { method: "DELETE" }));
      window.dispatchEvent(new Event("carrito-actualizado"));
    } catch (error) {
      setMensaje(error instanceof ApiError ? error.message : "No pudimos eliminar el item");
    }
  }

  async function vaciar() {
    if (!window.confirm("¿Estás seguro de que querés vaciar el carrito?")) return;

    try {
      setCarrito(await apiFetchInterna<Carrito>("/api/carrito", { method: "DELETE" }));
      window.dispatchEvent(new Event("carrito-actualizado"));
    } catch (error) {
      setMensaje(error instanceof ApiError ? error.message : "No pudimos vaciar el carrito");
    }
  }

  if (cargando) return <p className="p-6 text-sm text-gray-500">Cargando carrito...</p>;
  if (mensaje && !carrito) {
    return <section className="p-6"><div className="border border-black p-8"><p>{mensaje}</p><Link href="/login" className="mt-5 inline-block bg-black px-5 py-3 text-xs font-bold uppercase tracking-widest text-white">Ingresar</Link></div></section>;
  }
  if (!carrito) return null;

  return (
    <section className="p-6 sm:p-10">
      <div className="flex items-end justify-between border-b-2 border-black pb-5">
        <div><p className="font-manrope text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Tu</p><h1 className="mt-2 font-epilogue text-4xl font-bold uppercase tracking-[-0.04em]">CARRITO</h1></div>
        {!!carrito.items.length && <button type="button" onClick={vaciar} className="text-xs font-bold uppercase tracking-widest underline">Vaciar</button>}
      </div>
      {mensaje && <p className="mt-5 text-sm text-red-700" role="alert">{mensaje}</p>}
      {!carrito.items.length ? (
        <div className="py-20 text-center"><p className="text-gray-500">Tu carrito está vacío.</p><Link href="/categorias" className="mt-6 inline-block bg-black px-5 py-3 text-xs font-bold uppercase tracking-widest text-white">Explorar productos</Link></div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="divide-y divide-gray-200 border-y border-black">
            {carrito.items.map((item) => {
              const variante = item.talleProducto;
              const nombre = variante?.producto.nombre ?? item.productoImprovisado?.nombre ?? "Producto";
              const imagen = variante?.producto.imagenes[0]?.url;
              return <article key={item.id} className="flex gap-4 py-5"><div className="h-28 w-24 shrink-0 bg-gray-100">{imagen && <img src={imagen} alt={nombre} className="h-full w-full object-cover" />}</div><div className="flex min-w-0 flex-1 flex-col justify-between"><div><h2 className="font-epilogue text-lg font-bold uppercase">{nombre}</h2>{variante && <p className="mt-1 text-sm text-gray-500">{variante.color.nombre} / {variante.talle.valor}</p>}<p className="mt-2 text-sm">{moneda.format(Number(item.precioUnitario))}</p></div><div className="mt-4 flex items-center justify-between"><div><div className="flex items-center border border-black"><button type="button" aria-label="Reducir cantidad" onClick={() => item.cantidad > 1 && actualizarItem(item.id, item.cantidad - 1)} className="p-2 disabled:opacity-30" disabled={item.cantidad <= 1}><Minus size={14} /></button><span className="min-w-8 text-center text-sm">{item.cantidad}</span><button type="button" aria-label="Aumentar cantidad" onClick={() => actualizarItem(item.id, item.cantidad + 1)} className="p-2"><Plus size={14} /></button></div>{mensajesStock[item.id] && <p className="mt-2 text-sm text-red-700" role="alert">{mensajesStock[item.id]}</p>}</div><button type="button" aria-label={`Eliminar ${nombre}`} onClick={() => eliminarItem(item.id)} className="text-gray-500 hover:text-black"><Trash2 size={18} /></button></div></div></article>;
            })}
          </div>
          <aside className="h-fit border-t-2 border-black pt-5"><div className="flex justify-between font-epilogue text-xl font-bold uppercase"><span>Subtotal</span><span>{moneda.format(carrito.subtotal)}</span></div><p className="mt-3 text-sm text-gray-500">El envío y el pago se calculan al confirmar la compra.</p><Link href="/categorias" className="mt-7 block w-full border border-black px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-black">Seguir Comprando</Link><button type="button" disabled className="mt-3 w-full bg-black px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white opacity-40">Checkout próximamente</button></aside>
        </div>
      )}
    </section>
  );
}