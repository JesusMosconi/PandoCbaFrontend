import { apiFetch } from "@/lib/api";
import { Producto } from "@/types/producto";
import Link from "next/link";

export default async function ProductosPage() {
  let productos: Producto[];

  try {
    productos = await apiFetch<Producto[]>("/productos");
  } catch {
    return (
      <section className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          No pudimos cargar los productos. Intentá de nuevo más tarde.
        </div>
      </section>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {productos.map((p) => (
          <Link
            key={p.id}
            href={`/productos/${p.id}`}
            className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
          >
            {p.imagenes[0] && (
              <img
                src={p.imagenes[0].url}
                alt={p.nombre}
                className="w-full h-48 object-cover rounded mb-2"
              />
            )}
            <h3 className="font-semibold">{p.nombre}</h3>
            <p className="text-gray-600">${p.precio}</p>
            <p className="text-sm text-gray-400">{p.categoria.nombre}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
