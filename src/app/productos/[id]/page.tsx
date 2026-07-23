import ProductVariants from "@/components/ProductVariants";
import { ApiError, apiFetch } from "@/lib/api";
import type { Producto } from "@/types/producto";
import { notFound } from "next/navigation";

type ProductoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { id } = await params;
  let producto: Producto;

  try {
    producto = await apiFetch<Producto>(`/productos/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <section className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          No pudimos cargar este producto. Intentá de nuevo más tarde.
        </div>
      </section>
    );
  }

  const imagenes = [...producto.imagenes].sort((a, b) => a.orden - b.orden);

  return (
    <article className="grid gap-8 p-6 md:grid-cols-2">
      <section className="grid grid-cols-2 gap-3" aria-label={`Imágenes de ${producto.nombre}`}>
        {imagenes.length ? (
          imagenes.map((imagen) => (
            <img
              key={`${imagen.url}-${imagen.orden}`}
              src={imagen.url}
              alt={producto.nombre}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))
        ) : (
          <div className="col-span-2 flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
            Sin imágenes disponibles
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <p className="mb-2 text-sm text-gray-500">{producto.categoria.nombre}</p>
          <h1 className="text-3xl font-bold tracking-tight">{producto.nombre}</h1>
          <p className="mt-3 text-xl font-semibold">${producto.precio}</p>
          {producto.coleccion && (
            <p className="mt-2 text-sm text-gray-500">Colección: {producto.coleccion.nombre}</p>
          )}
        </div>

        {producto.descripcion && <p className="leading-7 text-gray-700">{producto.descripcion}</p>}

        <ProductVariants talles={producto.talles} />
      </section>
    </article>
  );
}
