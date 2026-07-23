export default function Loading() {
  return (
    <section className="p-6" aria-label="Cargando productos">
      <div className="mb-4 h-8 w-36 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="rounded-lg border p-4">
            <div className="mb-2 h-48 w-full animate-pulse rounded bg-gray-200" />
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
