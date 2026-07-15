import { apiFetch } from "@/lib/api";
import { Producto } from "@/types/producto";

export default async function ProductosPage() {
  const productos = await apiFetch<Producto[]>("/productos");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {productos.map((p) => (
          <div key={p.id} className="border rounded-lg p-4">
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
          </div>
        ))}
      </div>
    </div>
  );
}