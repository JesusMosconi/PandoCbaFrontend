"use client";

import { useMemo, useState } from "react";
import type { Producto } from "@/types/producto";

type ProductVariantsProps = {
  talles: Producto["talles"];
};

export default function ProductVariants({ talles }: ProductVariantsProps) {
  const disponibles = useMemo(() => talles.filter((variante) => variante.stock > 0), [talles]);
  const colores = useMemo(
    () => [...new Map(disponibles.map((variante) => [variante.color.hex, variante.color])).values()],
    [disponibles]
  );
  const [colorSeleccionado, setColorSeleccionado] = useState(colores[0]?.hex);
  const tallesDelColor = disponibles.filter((variante) => variante.color.hex === colorSeleccionado);
  const [talleSeleccionado, setTalleSeleccionado] = useState<string | undefined>();

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
              aria-pressed={talleSeleccionado === variante.talle.valor}
              onClick={() => setTalleSeleccionado(variante.talle.valor)}
              className={`rounded border px-3 py-1.5 text-sm ${
                talleSeleccionado === variante.talle.valor ? "border-black bg-black text-white" : "border-gray-300"
              }`}
            >
              {variante.talle.valor}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
