import { apiFetch } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Producto } from "@/types/producto";

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
        {productos.map((producto) => <ProductCard key={producto.id} producto={producto} />)}
      </div>
    </div>
  );
}
