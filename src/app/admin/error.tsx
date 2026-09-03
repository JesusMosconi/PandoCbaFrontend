"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="border-4 border-black bg-white p-6 sm:p-10">
      <p className="font-epilogue text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
        Error del panel
      </p>
      <h1 className="mt-3 font-epilogue text-3xl font-black uppercase tracking-tight sm:text-5xl">
        No pudimos cargar esta sección
      </h1>
      <p className="mt-6 border-y-2 border-black py-4 text-sm text-neutral-700">
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 border-2 border-black bg-black px-5 py-3 font-epilogue text-xs font-bold uppercase tracking-[0.16em] text-white"
      >
        Reintentar
      </button>
    </section>
  );
}
