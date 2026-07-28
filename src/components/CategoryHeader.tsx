type CategoryHeaderProps = {
  nombre: string;
  descripcion?: string;
};

export default function CategoryHeader({ nombre, descripcion }: CategoryHeaderProps) {
  return (
    <header className="border-b border-black px-6 py-10 md:px-12 md:py-14">
      <h1 className="font-epilogue text-5xl font-black uppercase tracking-[-0.04em] text-[#1A1C1C] md:text-[80px] md:leading-none">
        {nombre}
      </h1>
      {descripcion && (
        <p className="mt-4 max-w-2xl text-base leading-[1.6] text-[#5D5F5F] md:text-lg">
          {descripcion}
        </p>
      )}
    </header>
  );
}
