import Link from "next/link";
import { ArrowUpRight, ImageIcon, Package, ShieldCheck, Users } from "lucide-react";
import { exigirAdministrador } from "@/lib/autorizacion";

export default async function AdminPage() {
  await exigirAdministrador();

  const modulos = [
    {
      href: "/admin/imagenes",
      titulo: "Imágenes",
      descripcion: "Gestioná banners, categorías, colecciones y contenido visual del sitio.",
      icono: ImageIcon,
      etiqueta: "Visual",
    },
    {
      href: "/admin/productos",
      titulo: "Productos",
      descripcion: "Administrá catálogo, talles, colores, variantes y stock editorial.",
      icono: Package,
      etiqueta: "Catálogo",
    },
    {
      href: "/admin/clientes",
      titulo: "Clientes",
      descripcion: "Consultá cuentas, roles, estados y actividad disponible de los usuarios.",
      icono: Users,
      etiqueta: "Usuarios",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-black pb-8">
          <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Panel administrativo</span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-manrope text-xs uppercase tracking-[0.2em] text-neutral-500">
                Acceso restringido
              </p>
              <h1 className="mt-3 font-epilogue text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
                Dashboard
              </h1>
            </div>

            <div className="rounded-full border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-black">
              Módulos activos
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="border border-black bg-black p-6 text-white">
            <p className="font-manrope text-[10px] uppercase tracking-[0.3em] text-neutral-300">
              Estado
            </p>
            <p className="mt-6 font-epilogue text-5xl font-black leading-none">3</p>
            <p className="mt-3 text-sm text-neutral-300">Secciones operativas disponibles.</p>
          </div>

          <div className="border border-black bg-white p-6">
            <p className="font-manrope text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Rol
            </p>
            <p className="mt-6 font-epilogue text-2xl font-black uppercase leading-tight text-black">
              Administrador
            </p>
            <p className="mt-3 text-sm text-neutral-600">Permisos completos del sitio.</p>
          </div>

          <div className="border border-black bg-white p-6">
            <p className="font-manrope text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Inicio
            </p>
            <p className="mt-6 font-epilogue text-2xl font-black uppercase leading-tight text-black">
              Gestión visual
            </p>
            <p className="mt-3 text-sm text-neutral-600">Actualizá la identidad de la marca.</p>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          {modulos.map(({ href, titulo, descripcion, icono: Icono, etiqueta }) => (
            <Link
              key={href}
              href={href}
              className="group flex h-full flex-col justify-between border border-black bg-white p-6 transition-transform duration-200 hover:-translate-y-1 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center border border-black bg-black text-white">
                  <Icono className="h-5 w-5" />
                </div>
                <span className="font-manrope text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">
                  {etiqueta}
                </span>
              </div>

              <div className="mt-8">
                <h2 className="font-epilogue text-3xl font-black uppercase leading-none text-black">
                  {titulo}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-neutral-600">{descripcion}</p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-black pt-4">
                <span className="font-manrope text-[10px] font-bold uppercase tracking-[0.25em] text-black">
                  Entrar
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
