"use client";

import { FormEvent, useState } from "react";
import { apiFetchAdmin } from "@/lib/api";
import type { Categoria } from "@/types/categoria";
import type { Coleccion } from "@/types/coleccion";
import type { ContenidoInicio } from "@/types/contenido-inicio";
import type { ImagenNosotros } from "@/types/imagen-nosotros";

type TipoEntidad = "categorias" | "colecciones" | "contenido-inicio" | "imagenes-nosotros";

type ItemImagen = {
  id: number;
  nombre: string;
  imagenUrl: string | null;
};

type Seccion = {
  tipo: TipoEntidad;
  titulo: string;
  descripcion: string;
  items: ItemImagen[];
};

type Props = {
  categorias: Categoria[];
  colecciones: Coleccion[];
  contenidos: ContenidoInicio[];
  imagenesNosotros: ImagenNosotros[];
};

function claveItem(tipo: TipoEntidad, id: number) {
  return `${tipo}-${id}`;
}

export default function AdminImagenes({ categorias, colecciones, contenidos, imagenesNosotros }: Props) {
  const [secciones, setSecciones] = useState<Seccion[]>([
    {
      tipo: "categorias",
      titulo: "Categorías",
      descripcion: "Imágenes utilizadas en las tarjetas de la sección Categorías.",
      items: categorias.map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        imagenUrl: categoria.imagenUrl,
      })),
    },
    {
      tipo: "colecciones",
      titulo: "Colecciones",
      descripcion: "Portadas de los drops y fondo principal utilizado actualmente en Inicio.",
      items: colecciones.map((coleccion) => ({
        id: coleccion.id,
        nombre: coleccion.nombre,
        imagenUrl: coleccion.imagenUrl,
      })),
    },
    {
      tipo: "contenido-inicio",
      titulo: "Contenido de Inicio",
      descripcion: "Imágenes asociadas a las secciones configurables de la página de Inicio.",
      items: contenidos.map((contenido) => ({
        id: contenido.id,
        nombre: contenido.seccionNombre,
        imagenUrl: contenido.imagenUrl,
      })),
    },
    {
      tipo: "imagenes-nosotros",
      titulo: "Nosotros",
      descripcion: "Imagen principal y las tres imágenes del proceso creativo.",
      items: imagenesNosotros.map((imagen) => ({
        id: imagen.id,
        nombre: imagen.nombre,
        imagenUrl: imagen.imagenUrl,
      })),
    },
  ]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Record<string, { tipo: "ok" | "error"; texto: string }>>({});

  function actualizarImagen(tipo: TipoEntidad, id: number, imagenUrl: string | null) {
    setSecciones((actuales) =>
      actuales.map((seccion) =>
        seccion.tipo === tipo
          ? {
              ...seccion,
              items: seccion.items.map((item) => (item.id === id ? { ...item, imagenUrl } : item)),
            }
          : seccion
      )
    );
  }

  async function subirImagen(event: FormEvent<HTMLFormElement>, tipo: TipoEntidad, id: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const key = claveItem(tipo, id);
    const formData = new FormData(form);
    const imagen = formData.get("imagen");

    if (!(imagen instanceof File) || !imagen.size) {
      setMensajes((actuales) => ({
        ...actuales,
        [key]: { tipo: "error", texto: "Seleccioná una imagen antes de subirla." },
      }));
      return;
    }

    setProcesando(key);
    setMensajes((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[key];
      return siguientes;
    });

    try {
      const actualizada = await apiFetchAdmin<{ imagenUrl: string }>(`/${tipo}/${id}/imagen`, {
        method: "POST",
        body: formData,
      });
      actualizarImagen(tipo, id, actualizada.imagenUrl);
      form.reset();
      setMensajes((actuales) => ({
        ...actuales,
        [key]: { tipo: "ok", texto: "Imagen guardada correctamente." },
      }));
    } catch (error) {
      setMensajes((actuales) => ({
        ...actuales,
        [key]: {
          tipo: "error",
          texto: error instanceof Error ? error.message : "No se pudo guardar la imagen.",
        },
      }));
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarImagen(tipo: TipoEntidad, id: number) {
    if (!window.confirm("¿Querés eliminar esta imagen?")) return;

    const key = claveItem(tipo, id);
    setProcesando(key);
    setMensajes((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[key];
      return siguientes;
    });

    try {
      await apiFetchAdmin(`/${tipo}/${id}/imagen`, { method: "DELETE" });
      actualizarImagen(tipo, id, null);
      setMensajes((actuales) => ({
        ...actuales,
        [key]: { tipo: "ok", texto: "Imagen eliminada." },
      }));
    } catch (error) {
      setMensajes((actuales) => ({
        ...actuales,
        [key]: {
          tipo: "error",
          texto: error instanceof Error ? error.message : "No se pudo eliminar la imagen.",
        },
      }));
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div className="space-y-14">
      {secciones.map((seccion) => (
        <section key={seccion.tipo}>
          <div className="border-b-2 border-black pb-4">
            <h2 className="font-epilogue text-2xl font-bold uppercase sm:text-3xl">{seccion.titulo}</h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">{seccion.descripcion}</p>
          </div>

          {seccion.items.length ? (
            <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
              {seccion.items.map((item) => {
                const key = claveItem(seccion.tipo, item.id);
                const ocupado = procesando === key;
                const mensaje = mensajes[key];

                return (
                  <article key={item.id} className="border-2 border-black bg-white">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-neutral-200">
                      {item.imagenUrl ? (
                        <img src={item.imagenUrl} alt={item.nombre} className="h-full w-full object-cover" />
                      ) : (
                        <span className="px-4 text-center text-xs font-bold uppercase tracking-widest text-neutral-500">
                          Sin imagen
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">ID {item.id}</p>
                      <h3 className="mt-1 font-epilogue text-xl font-bold">{item.nombre}</h3>

                      <form
                        className="mt-5 space-y-3"
                        onSubmit={(event) => subirImagen(event, seccion.tipo, item.id)}
                      >
                        <input
                          type="file"
                          name="imagen"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          disabled={ocupado}
                          className="block w-full text-xs file:mr-3 file:border file:border-black file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={ocupado}
                            className="flex-1 bg-black px-4 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {ocupado ? "Procesando..." : item.imagenUrl ? "Reemplazar" : "Subir imagen"}
                          </button>
                          {item.imagenUrl && (
                            <button
                              type="button"
                              disabled={ocupado}
                              onClick={() => eliminarImagen(seccion.tipo, item.id)}
                              className="border border-red-700 px-4 py-3 text-xs font-bold uppercase text-red-700 disabled:opacity-50"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </form>

                      {mensaje && (
                        <p
                          role="status"
                          className={`mt-3 text-xs ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-700"}`}
                        >
                          {mensaje.texto}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-sm text-neutral-500">No hay registros para administrar.</p>
          )}
        </section>
      ))}
    </div>
  );
}
