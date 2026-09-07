"use client";

import { useMemo, useState } from "react";
import { apiFetchInterna, ApiError } from "@/lib/api";
import type { Producto } from "@/types/producto";
import { useRouter } from "next/navigation";

type ProductVariantsProps = {
  talles: Producto["talles"];
};

export default function ProductVariants({ talles }: ProductVariantsProps) {
  const router = useRouter();
  const disponibles = useMemo(() => talles.filter((variante) => variante.stock > 0), [talles]);
  const colores = useMemo(
    () => [...new Map(disponibles.map((variante) => [variante.color.hex, variante.color])).values()],
    [disponibles]
  );
  const [colorSeleccionado, setColorSeleccionado] = useState(colores[0]?.hex);
  const tallesDelColor = disponibles.filter((variante) => variante.color.hex === colorSeleccionado);
  const [talleSeleccionado, setTalleSeleccionado] = useState<number | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  if (!disponibles.length) {
    return <p className="text-sm text-gray-500">No hay variantes disponibles por el momento.</p>;
  }

  return (
    <section className="space-y-4" aria-label="Seleccionar variante">
      <div>
        <p className="mb-2 text-sm font-medium">Color</p>
        <div className="flex flex-wrap gap-2">
          {colores.map((color) => (
            <button
              key={color.hex}
              type="button"
              aria-pressed={colorSeleccionado === color.hex}
              onClick={() => {
                setColorSeleccionado(color.hex);
                setTalleSeleccionado(undefined);
              }}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                colorSeleccionado === color.hex ? "border-black bg-black text-white" : "border-gray-300"
              }`}
            >
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full border border-gray-300 align-middle"
                style={{ backgroundColor: color.hex }}
              />
              {color.nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Talle</p>
        <div className="flex flex-wrap gap-2">
          {tallesDelColor.map((variante) => (
            <button
              key={variante.id}
              type="button"
              aria-pressed={talleSeleccionado === variante.id}
              onClick={() => setTalleSeleccionado(variante.id)}
              className={`rounded border px-3 py-1.5 text-sm ${
                talleSeleccionado === variante.id ? "border-black bg-black text-white" : "border-gray-300"
              }`}
            >
              {variante.talle.valor}
            </button>
          ))}
        </div>
      </div>
      {mensaje && <p className="text-sm text-red-700" role="alert">{mensaje}</p>}
      <button
        type="button"
        disabled={!talleSeleccionado || enviando}
        onClick={async () => {
          if (!talleSeleccionado) return;
          setEnviando(true);
          setMensaje("");
          try {
            await apiFetchInterna("/api/carrito/items", {
              method: "POST",
              body: JSON.stringify({ talleProductoId: talleSeleccionado, cantidad: 1 }),
            });
            router.push("/carrito");
          } catch (error) {
            setMensaje(error instanceof ApiError ? error.message : "No pudimos agregar la variante");
          } finally {
            setEnviando(false);
          }
        }}
        className="w-full bg-black px-5 py-4 font-manrope text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enviando ? "Agregando..." : "Agregar al carrito"}
      </button>
    </section>
  );
}
