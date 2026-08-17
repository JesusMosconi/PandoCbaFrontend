"use client";

import { FormEvent, useState } from "react";
import { apiFetchAdmin } from "@/lib/api";
import type { Categoria } from "@/types/categoria";
import type { Coleccion } from "@/types/coleccion";
import type { Color } from "@/types/color";
import type { Producto } from "@/types/producto";
import type { Talle } from "@/types/talle";
import type { TalleProducto } from "@/types/talle-producto";

type Props = {
  productos: Producto[];
  categorias: Categoria[];
  colecciones: Coleccion[];
  talles: Talle[];
  colores: Color[];
};

type Mensaje = { tipo: "ok" | "error"; texto: string };

type ImagenProducto = {
  id: number;
  url: string;
  orden: number;
  productoId: number;
};

type ProductoForm = {
  nombre: string;
  descripcion: string;
  precio: string;
  categoriaId: string;
  coleccionId: string;
  activo: boolean;
  web: boolean;
};

const formVacio: ProductoForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  categoriaId: "",
  coleccionId: "",
  activo: true,
  web: true,
};

const inputClass = "w-full border-2 border-black bg-white px-3 py-2 text-sm";
const botonNegro = "bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50";

function MensajeEstado({ mensaje }: { mensaje?: Mensaje }) {
  return mensaje ? (
    <p role="status" className={`mt-2 text-xs ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-700"}`}>
      {mensaje.texto}
    </p>
  ) : null;
}

export default function AdminProductos({
  productos: productosIniciales,
  categorias,
  colecciones,
  talles: tallesIniciales,
  colores: coloresIniciales,
}: Props) {
  const [productos, setProductos] = useState(productosIniciales);
  const [talles, setTalles] = useState(tallesIniciales);
  const [colores, setColores] = useState(coloresIniciales);
  const [formVisible, setFormVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [productoForm, setProductoForm] = useState<ProductoForm>(formVacio);
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [imagenesExpandidoId, setImagenesExpandidoId] = useState<number | null>(null);
  const [imagenesPorProducto, setImagenesPorProducto] = useState<Record<number, ImagenProducto[]>>({});
  const [mensajes, setMensajes] = useState<Record<string, Mensaje>>({});
  const [procesando, setProcesando] = useState<string | null>(null);
  const [talleEditandoId, setTalleEditandoId] = useState<number | null>(null);
  const [colorEditandoId, setColorEditandoId] = useState<number | null>(null);

  function mostrarMensaje(clave: string, mensaje?: Mensaje) {
    setMensajes((actuales) => {
      const siguientes = { ...actuales };
      if (mensaje) siguientes[clave] = mensaje;
      else delete siguientes[clave];
      return siguientes;
    });
  }

  function abrirNuevo() {
    setEditandoId(null);
    setProductoForm(formVacio);
    setFormVisible(true);
    mostrarMensaje("producto-form");
  }

  function abrirEdicion(producto: Producto) {
    setEditandoId(producto.id);
    setProductoForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? "",
      precio: producto.precio,
      categoriaId: String(producto.categoriaId),
      coleccionId: producto.coleccionId ? String(producto.coleccionId) : "",
      activo: producto.activo,
      web: producto.web,
    });
    setFormVisible(true);
    mostrarMensaje("producto-form");
  }

  async function guardarProducto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clave = "producto-form";
    setProcesando(clave);
    mostrarMensaje(clave);
    const coleccionId = productoForm.coleccionId ? Number(productoForm.coleccionId) : null;
    const data = {
      nombre: productoForm.nombre,
      descripcion: productoForm.descripcion,
      precio: Number(productoForm.precio),
      categoriaId: Number(productoForm.categoriaId),
      ...(coleccionId !== null ? { coleccionId } : {}),
      activo: productoForm.activo,
      web: productoForm.web,
    };

    try {
      const guardado = await apiFetchAdmin<Producto>(editandoId ? `/productos/${editandoId}` : "/productos", {
        method: editandoId ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      const categoria = categorias.find((item) => item.id === data.categoriaId)!;
      const coleccion = colecciones.find((item) => item.id === coleccionId) ?? null;
      const completo: Producto = {
        ...guardado,
        categoria,
        coleccion,
        imagenes: editandoId ? productos.find((item) => item.id === editandoId)?.imagenes ?? [] : [],
        talles: editandoId ? productos.find((item) => item.id === editandoId)?.talles ?? [] : [],
      };
      setProductos((actuales) =>
        editandoId ? actuales.map((item) => (item.id === editandoId ? completo : item)) : [...actuales, completo]
      );
      setProductoForm(formVacio);
      setEditandoId(null);
      setFormVisible(false);
      mostrarMensaje("productos", { tipo: "ok", texto: "Producto guardado correctamente." });
    } catch (error) {
      mostrarMensaje(clave, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo guardar el producto.",
      });
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarProducto(id: number) {
    if (!window.confirm("\u00bfQuer\u00e9s desactivar este producto?")) return;
    const clave = `producto-${id}`;
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      await apiFetchAdmin(`/productos/${id}`, { method: "DELETE" });
      setProductos((actuales) => actuales.map((item) => (item.id === id ? { ...item, activo: false } : item)));
      mostrarMensaje(clave, { tipo: "ok", texto: "Producto desactivado." });
    } catch (error) {
      mostrarMensaje(clave, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo desactivar el producto.",
      });
    } finally {
      setProcesando(null);
    }
  }

  function actualizarImagenesProducto(productoId: number, imagenes: ImagenProducto[]) {
    const ordenadas = [...imagenes].sort((a, b) => a.orden - b.orden);
    setImagenesPorProducto((actuales) => ({ ...actuales, [productoId]: ordenadas }));
    setProductos((actuales) =>
      actuales.map((producto) => (producto.id === productoId ? { ...producto, imagenes: ordenadas } : producto))
    );
  }

  async function toggleImagenes(productoId: number) {
    if (imagenesExpandidoId === productoId) {
      setImagenesExpandidoId(null);
      return;
    }

    setImagenesExpandidoId(productoId);
    if (imagenesPorProducto[productoId] !== undefined) return;

    const clave = `imagenes-carga-${productoId}`;
    setProcesando(clave);
    mostrarMensaje(`imagenes-${productoId}`);
    try {
      const imagenes = await apiFetchAdmin<ImagenProducto[]>(`/img-producto/${productoId}`);
      actualizarImagenesProducto(productoId, imagenes);
    } catch (error) {
      mostrarMensaje(`imagenes-${productoId}`, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudieron cargar las imágenes.",
      });
    } finally {
      setProcesando(null);
    }
  }

  async function subirImagenes(event: FormEvent<HTMLFormElement>, productoId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const archivos = Array.from(new FormData(form).getAll("imagenes")).filter(
      (archivo): archivo is File => archivo instanceof File && archivo.size > 0
    );
    const clave = `imagen-upload-${productoId}`;

    if (!archivos.length) {
      mostrarMensaje(clave, { tipo: "error", texto: "Seleccioná al menos una imagen antes de subir." });
      return;
    }

    const formData = new FormData();
    formData.append("productoId", String(productoId));
    archivos.forEach((archivo) => formData.append("imagenes", archivo));
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const creadas = await apiFetchAdmin<ImagenProducto[]>("/img-producto/upload", {
        method: "POST",
        body: formData,
      });
      actualizarImagenesProducto(productoId, [...(imagenesPorProducto[productoId] ?? []), ...creadas]);
      form.reset();
      mostrarMensaje(clave, { tipo: "ok", texto: "Imágenes subidas correctamente." });
    } catch (error) {
      mostrarMensaje(clave, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudieron subir las imágenes.",
      });
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarImagen(productoId: number, imagenId: number) {
    if (!window.confirm("¿Querés eliminar esta imagen?")) return;
    const clave = `imagen-${imagenId}`;
    setProcesando(clave);
    mostrarMensaje(`imagenes-${productoId}`);
    try {
      await apiFetchAdmin(`/img-producto/${imagenId}`, { method: "DELETE" });
      const restantes = (imagenesPorProducto[productoId] ?? []).filter((imagen) => imagen.id !== imagenId);
      actualizarImagenesProducto(productoId, restantes);
      mostrarMensaje(`imagenes-${productoId}`, { tipo: "ok", texto: "Imagen eliminada." });
    } catch (error) {
      mostrarMensaje(`imagenes-${productoId}`, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo eliminar la imagen.",
      });
    } finally {
      setProcesando(null);
    }
  }

  function actualizarVariante(productoId: number, variante: TalleProducto) {
    setProductos((actuales) => actuales.map((producto) =>
      producto.id === productoId
        ? {
            ...producto,
            talles: producto.talles.some((item) => item.id === variante.id)
              ? producto.talles.map((item) => (item.id === variante.id ? variante : item))
              : [...producto.talles, variante],
          }
        : producto
    ));
  }

  async function agregarVariante(event: FormEvent<HTMLFormElement>, productoId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const dataForm = new FormData(form);
    const clave = `variante-nueva-${productoId}`;
    const data = {
      productoId,
      talleId: Number(dataForm.get("talleId")),
      colorId: Number(dataForm.get("colorId")),
      stock: Number(dataForm.get("stock")),
      estado: String(dataForm.get("estado")),
    };
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const variante = await apiFetchAdmin<TalleProducto>("/talle-producto", {
        method: "POST",
        body: JSON.stringify(data),
      });
      actualizarVariante(productoId, variante);
      form.reset();
      mostrarMensaje(clave, { tipo: "ok", texto: "Variante agregada." });
    } catch (error) {
      mostrarMensaje(clave, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo agregar la variante.",
      });
    } finally {
      setProcesando(null);
    }
  }

  async function guardarStock(event: FormEvent<HTMLFormElement>, productoId: number, variante: TalleProducto) {
    event.preventDefault();
    const stock = Number(new FormData(event.currentTarget).get("stock"));
    const clave = `variante-${variante.id}`;
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const actualizada = await apiFetchAdmin<TalleProducto>(`/talle-producto/${variante.id}`, {
        method: "PUT",
        body: JSON.stringify({
          stock,
          estado: variante.estado,
          productoId: variante.productoId,
          talleId: variante.talleId,
          colorId: variante.colorId,
        }),
      });
      actualizarVariante(productoId, actualizada);
      mostrarMensaje(clave, { tipo: "ok", texto: "Stock guardado." });
    } catch (error) {
      mostrarMensaje(clave, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo guardar el stock.",
      });
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarVariante(productoId: number, varianteId: number) {
    if (!window.confirm("\u00bfQuer\u00e9s desactivar esta variante?")) return;
    const clave = `variante-${varianteId}`;
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const actualizada = await apiFetchAdmin<TalleProducto>(`/talle-producto/${varianteId}`, { method: "DELETE" });
      actualizarVariante(productoId, actualizada);
      mostrarMensaje(clave, { tipo: "ok", texto: "Variante desactivada." });
    } catch (error) {
      mostrarMensaje(clave, {
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo desactivar la variante.",
      });
    } finally {
      setProcesando(null);
    }
  }

  async function agregarTalle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const dataForm = new FormData(form);
    const orden = String(dataForm.get("orden"));
    const clave = "talle-nuevo";
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const respuesta = await apiFetchAdmin<{ talle: Talle }>("/talles", {
        method: "POST",
        body: JSON.stringify({ valor: String(dataForm.get("valor")), ...(orden ? { orden: Number(orden) } : {}) }),
      });
      setTalles((actuales) => [...actuales, respuesta.talle]);
      form.reset();
      mostrarMensaje(clave, { tipo: "ok", texto: "Talle agregado." });
    } catch (error) {
      mostrarMensaje(clave, { tipo: "error", texto: error instanceof Error ? error.message : "No se pudo agregar el talle." });
    } finally {
      setProcesando(null);
    }
  }

  async function agregarColor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const dataForm = new FormData(form);
    const clave = "color-nuevo";
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const respuesta = await apiFetchAdmin<{ color: Color }>("/colors", {
        method: "POST",
        body: JSON.stringify({ nombre: String(dataForm.get("nombre")), hex: String(dataForm.get("hex")) }),
      });
      setColores((actuales) => [...actuales, respuesta.color]);
      form.reset();
      mostrarMensaje(clave, { tipo: "ok", texto: "Color agregado." });
    } catch (error) {
      mostrarMensaje(clave, { tipo: "error", texto: error instanceof Error ? error.message : "No se pudo agregar el color." });
    } finally {
      setProcesando(null);
    }
  }

  async function editarTalle(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const dataForm = new FormData(event.currentTarget);
    const orden = String(dataForm.get("orden"));
    const clave = `talle-${id}`;
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const actualizado = await apiFetchAdmin<Talle>(`/talles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ valor: String(dataForm.get("valor")), ...(orden ? { orden: Number(orden) } : {}) }),
      });
      setTalles((actuales) => actuales.map((item) => (item.id === id ? actualizado : item)));
      setTalleEditandoId(null);
      mostrarMensaje(clave, { tipo: "ok", texto: "Talle actualizado." });
    } catch (error) {
      mostrarMensaje(clave, { tipo: "error", texto: error instanceof Error ? error.message : "No se pudo actualizar el talle." });
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarTalle(id: number) {
    if (!window.confirm("\u00bfQuer\u00e9s eliminar este talle?")) return;
    const clave = `talle-${id}`;
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      await apiFetchAdmin(`/talles/${id}`, { method: "DELETE" });
      setTalles((actuales) => actuales.filter((item) => item.id !== id));
    } catch (error) {
      mostrarMensaje(clave, { tipo: "error", texto: error instanceof Error ? error.message : "No se pudo eliminar el talle." });
    } finally {
      setProcesando(null);
    }
  }

  async function editarColor(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const dataForm = new FormData(event.currentTarget);
    const clave = `color-${id}`;
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      const actualizado = await apiFetchAdmin<Color>(`/colors/${id}`, {
        method: "PUT",
        body: JSON.stringify({ nombre: String(dataForm.get("nombre")), hex: String(dataForm.get("hex")) }),
      });
      setColores((actuales) => actuales.map((item) => (item.id === id ? actualizado : item)));
      setColorEditandoId(null);
      mostrarMensaje(clave, { tipo: "ok", texto: "Color actualizado." });
    } catch (error) {
      mostrarMensaje(clave, { tipo: "error", texto: error instanceof Error ? error.message : "No se pudo actualizar el color." });
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarColor(id: number) {
    if (!window.confirm("\u00bfQuer\u00e9s eliminar este color?")) return;
    const clave = `color-${id}`;
    setProcesando(clave);
    mostrarMensaje(clave);
    try {
      await apiFetchAdmin(`/colors/${id}`, { method: "DELETE" });
      setColores((actuales) => actuales.filter((item) => item.id !== id));
    } catch (error) {
      mostrarMensaje(clave, { tipo: "error", texto: error instanceof Error ? error.message : "No se pudo eliminar el color." });
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <h2 className="font-epilogue text-2xl font-bold uppercase sm:text-3xl">Productos</h2>
            <p className="mt-2 text-sm text-neutral-600">{"Administr\u00e1 el cat\u00e1logo y despleg\u00e1 sus variantes."}</p>
          </div>
          <button type="button" onClick={abrirNuevo} className={botonNegro}>Nuevo producto</button>
        </div>
        <MensajeEstado mensaje={mensajes.productos} />

        {formVisible && (
          <form onSubmit={guardarProducto} className="mt-6 grid gap-4 border-2 border-black bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
            <h3 className="font-epilogue text-lg font-bold uppercase sm:col-span-2 lg:col-span-4">
              {editandoId ? `Editar producto #${editandoId}` : "Nuevo producto"}
            </h3>
            <label className="text-xs font-bold uppercase tracking-wider">Nombre
              <input required value={productoForm.nombre} onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">Precio
              <input required min="0" step="0.01" type="number" value={productoForm.precio} onChange={(e) => setProductoForm({ ...productoForm, precio: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">{"Categor\u00eda"}
              <select required value={productoForm.categoriaId} onChange={(e) => setProductoForm({ ...productoForm, categoriaId: e.target.value })} className={`${inputClass} mt-1`}>
                <option value="">Seleccionar</option>
                {categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">{"Colecci\u00f3n"}
              <select value={productoForm.coleccionId} onChange={(e) => setProductoForm({ ...productoForm, coleccionId: e.target.value })} className={`${inputClass} mt-1`}>
                <option value="">{"Sin colecci\u00f3n"}</option>
                {colecciones.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2 lg:col-span-4">{"Descripci\u00f3n"}
              <textarea value={productoForm.descripcion} onChange={(e) => setProductoForm({ ...productoForm, descripcion: e.target.value })} className={`${inputClass} mt-1 min-h-24`} />
            </label>
            <label className="flex items-center gap-2 text-xs font-bold uppercase"><input type="checkbox" checked={productoForm.activo} onChange={(e) => setProductoForm({ ...productoForm, activo: e.target.checked })} /> Activo</label>
            <label className="flex items-center gap-2 text-xs font-bold uppercase"><input type="checkbox" checked={productoForm.web} onChange={(e) => setProductoForm({ ...productoForm, web: e.target.checked })} /> Web</label>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button disabled={procesando === "producto-form"} className={botonNegro}>{procesando === "producto-form" ? "Guardando..." : "Guardar"}</button>
              <button type="button" onClick={() => setFormVisible(false)} className="border-2 border-black px-4 py-2 text-xs font-bold uppercase">Cancelar</button>
            </div>
            <div className="sm:col-span-2 lg:col-span-4"><MensajeEstado mensaje={mensajes["producto-form"]} /></div>
          </form>
        )}

        <div className="mt-6 overflow-x-auto border-2 border-black bg-white">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-wider text-white"><tr>
              {["Imagen", "ID", "Nombre", "Categor\u00eda", "Colecci\u00f3n", "Precio", "Activo", "Web", "Stock total", "Acciones"].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}
            </tr></thead>
            <tbody>
              {productos.map((producto) => (
                <FragmentoProducto
                  key={producto.id}
                  producto={producto}
                  expandido={expandidoId === producto.id}
                  imagenesExpandido={imagenesExpandidoId === producto.id}
                  imagenes={imagenesPorProducto[producto.id]}
                  talles={talles}
                  colores={colores}
                  procesando={procesando}
                  mensajes={mensajes}
                  onEditar={() => abrirEdicion(producto)}
                  onEliminar={() => eliminarProducto(producto.id)}
                  onExpandir={() => setExpandidoId(expandidoId === producto.id ? null : producto.id)}
                  onExpandirImagenes={() => toggleImagenes(producto.id)}
                  onSubirImagenes={subirImagenes}
                  onEliminarImagen={eliminarImagen}
                  onAgregarVariante={agregarVariante}
                  onGuardarStock={guardarStock}
                  onEliminarVariante={eliminarVariante}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="border-2 border-black bg-white p-5">
        <summary className="cursor-pointer font-epilogue text-xl font-bold uppercase">{"Cat\u00e1logo: talles y colores"}</summary>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <section>
            <h3 className="border-b-2 border-black pb-2 font-bold uppercase tracking-widest">Talles</h3>
            <ul className="my-4 space-y-2">{talles.map((item) => <li key={item.id} className="border-2 border-black p-2 text-sm">
              {talleEditandoId === item.id ? (
                <form onSubmit={(event) => editarTalle(event, item.id)} className="grid grid-cols-[1fr_6rem_auto] gap-2">
                  <input required name="valor" defaultValue={item.valor} className={inputClass} />
                  <input name="orden" type="number" defaultValue={item.orden ?? ""} placeholder="Orden" className={inputClass} />
                  <div className="flex gap-2">
                    <button disabled={procesando === `talle-${item.id}`} className={botonNegro}>Guardar</button>
                    <button type="button" onClick={() => setTalleEditandoId(null)} className="border-2 border-black px-3 py-2 text-xs font-bold uppercase">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span>{item.valor}{item.orden !== null ? ` - ${item.orden}` : ""}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTalleEditandoId(item.id)} className="text-xs font-bold uppercase underline">Editar</button>
                    <button type="button" disabled={procesando === `talle-${item.id}`} onClick={() => eliminarTalle(item.id)} className="text-xs font-bold uppercase text-red-700 underline disabled:opacity-50">Eliminar</button>
                  </div>
                </div>
              )}
              <MensajeEstado mensaje={mensajes[`talle-${item.id}`]} />
            </li>)}</ul>
            <form onSubmit={agregarTalle} className="grid grid-cols-[1fr_7rem_auto] gap-2">
              <input required name="valor" placeholder="Valor" className={inputClass} />
              <input name="orden" type="number" placeholder="Orden" className={inputClass} />
              <button disabled={procesando === "talle-nuevo"} className={botonNegro}>Agregar</button>
            </form>
            <MensajeEstado mensaje={mensajes["talle-nuevo"]} />
          </section>
          <section>
            <h3 className="border-b-2 border-black pb-2 font-bold uppercase tracking-widest">Colores</h3>
            <ul className="my-4 space-y-2">{colores.map((item) => <li key={item.id} className="border-2 border-black p-2 text-sm">
              {colorEditandoId === item.id ? (
                <form onSubmit={(event) => editarColor(event, item.id)} className="grid grid-cols-[1fr_4rem_auto] gap-2">
                  <input required name="nombre" defaultValue={item.nombre} className={inputClass} />
                  <input required name="hex" type="color" defaultValue={item.hex} className="h-full w-full border-2 border-black bg-white p-1" />
                  <div className="flex gap-2">
                    <button disabled={procesando === `color-${item.id}`} className={botonNegro}>Guardar</button>
                    <button type="button" onClick={() => setColorEditandoId(null)} className="border-2 border-black px-3 py-2 text-xs font-bold uppercase">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2"><span className="h-4 w-4 border border-black" style={{ backgroundColor: item.hex }} />{item.nombre} - {item.hex}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setColorEditandoId(item.id)} className="text-xs font-bold uppercase underline">Editar</button>
                    <button type="button" disabled={procesando === `color-${item.id}`} onClick={() => eliminarColor(item.id)} className="text-xs font-bold uppercase text-red-700 underline disabled:opacity-50">Eliminar</button>
                  </div>
                </div>
              )}
              <MensajeEstado mensaje={mensajes[`color-${item.id}`]} />
            </li>)}</ul>
            <form onSubmit={agregarColor} className="grid grid-cols-[1fr_4rem_auto] gap-2">
              <input required name="nombre" placeholder="Nombre" className={inputClass} />
              <input required name="hex" type="color" defaultValue="#000000" className="h-full w-full border-2 border-black bg-white p-1" />
              <button disabled={procesando === "color-nuevo"} className={botonNegro}>Agregar</button>
            </form>
            <MensajeEstado mensaje={mensajes["color-nuevo"]} />
          </section>
        </div>
      </details>
    </div>
  );
}

type FilaProps = {
  producto: Producto;
  expandido: boolean;
  imagenesExpandido: boolean;
  imagenes?: ImagenProducto[];
  talles: Talle[];
  colores: Color[];
  procesando: string | null;
  mensajes: Record<string, Mensaje>;
  onEditar: () => void;
  onEliminar: () => void;
  onExpandir: () => void;
  onExpandirImagenes: () => void;
  onSubirImagenes: (event: FormEvent<HTMLFormElement>, productoId: number) => void;
  onEliminarImagen: (productoId: number, imagenId: number) => void;
  onAgregarVariante: (event: FormEvent<HTMLFormElement>, productoId: number) => void;
  onGuardarStock: (event: FormEvent<HTMLFormElement>, productoId: number, variante: TalleProducto) => void;
  onEliminarVariante: (productoId: number, varianteId: number) => void;
};

function FragmentoProducto(props: FilaProps) {
  const { producto } = props;
  const stockTotal = producto.talles.filter((item) => item.estado === "activo").reduce((total, item) => total + item.stock, 0);
  const badge = (valor: boolean) => `inline-block border px-2 py-1 text-[10px] font-bold uppercase ${valor ? "border-green-700 text-green-700" : "border-neutral-400 text-neutral-500"}`;
  return <>
    <tr className="border-b border-neutral-300">
      <td className="px-3 py-3">
        {producto.imagenes[0]?.url ? (
          <img src={producto.imagenes[0].url} alt={producto.nombre} className="h-12 w-12 border-2 border-black object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-neutral-200 text-center text-xs font-bold uppercase text-neutral-500">Sin img</div>
        )}
      </td>
      <td className="px-3 py-3 font-bold">{producto.id}</td><td className="px-3 py-3 font-bold">{producto.nombre}</td>
      <td className="px-3 py-3">{producto.categoria.nombre}</td><td className="px-3 py-3">{producto.coleccion?.nombre ?? "-"}</td>
      <td className="px-3 py-3">${producto.precio}</td><td className="px-3 py-3"><span className={badge(producto.activo)}>{producto.activo ? "S\u00ed" : "No"}</span></td>
      <td className="px-3 py-3"><span className={badge(producto.web)}>{producto.web ? "S\u00ed" : "No"}</span></td><td className="px-3 py-3 font-bold">{stockTotal}</td>
      <td className="px-3 py-3"><div className="flex flex-wrap gap-2">
        <button type="button" onClick={props.onEditar} className="text-xs font-bold uppercase underline">Editar</button>
        <button type="button" disabled={props.procesando === `producto-${producto.id}`} onClick={props.onEliminar} className="text-xs font-bold uppercase text-red-700 underline disabled:opacity-50">Eliminar</button>
        <button type="button" onClick={props.onExpandirImagenes} className="text-xs font-bold uppercase underline">{props.imagenesExpandido ? "Ocultar imágenes" : "Imágenes"}</button>
        <button type="button" onClick={props.onExpandir} className="text-xs font-bold uppercase underline">{props.expandido ? "Ocultar variantes" : "Ver variantes"}</button>
      </div>{props.mensajes[`producto-${producto.id}`] && <p className={`mt-2 text-xs ${props.mensajes[`producto-${producto.id}`].tipo === "ok" ? "text-green-700" : "text-red-700"}`}>{props.mensajes[`producto-${producto.id}`].texto}</p>}</td>
    </tr>
    {props.imagenesExpandido && <tr className="border-b-2 border-black bg-neutral-100"><td colSpan={10} className="p-5">
      {props.procesando === `imagenes-carga-${producto.id}` && props.imagenes === undefined ? (
        <p className="text-xs font-bold uppercase text-neutral-500">Cargando imágenes...</p>
      ) : (
        <>
          {props.imagenes?.length ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {props.imagenes.map((imagen) => (
                <div key={imagen.id}>
                  <img src={imagen.url} alt={`${producto.nombre} - imagen ${imagen.orden}`} className="aspect-square w-full border-2 border-black object-cover" />
                  <button type="button" disabled={props.procesando === `imagen-${imagen.id}`} onClick={() => props.onEliminarImagen(producto.id, imagen.id)} className="mt-2 text-xs font-bold uppercase text-red-700 underline disabled:opacity-50">
                    {props.procesando === `imagen-${imagen.id}` ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-bold uppercase text-neutral-500">Sin imágenes cargadas.</p>
          )}
          <MensajeEstado mensaje={props.mensajes[`imagenes-${producto.id}`]} />
          <form onSubmit={(event) => props.onSubirImagenes(event, producto.id)} className="mt-5 space-y-3 border-t-2 border-black pt-5">
            <input type="file" name="imagenes" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={props.procesando === `imagen-upload-${producto.id}`} className="block w-full text-xs file:mr-3 file:border file:border-black file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase" />
            <button disabled={props.procesando === `imagen-upload-${producto.id}`} className={botonNegro}>{props.procesando === `imagen-upload-${producto.id}` ? "Subiendo..." : "Subir imágenes"}</button>
            <MensajeEstado mensaje={props.mensajes[`imagen-upload-${producto.id}`]} />
          </form>
        </>
      )}
    </td></tr>}
    {props.expandido && <tr className="border-b-2 border-black bg-neutral-100"><td colSpan={10} className="p-5">
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] bg-white text-sm"><thead><tr className="border-b-2 border-black text-xs uppercase tracking-wider"><th className="p-2">Talle</th><th className="p-2">Color</th><th className="p-2">Stock</th><th className="p-2">Estado</th><th className="p-2">Acciones</th></tr></thead><tbody>
        {producto.talles.map((variante) => <tr key={variante.id} className={`border-b border-neutral-300 ${variante.estado === "inactivo" ? "opacity-50" : ""}`}>
          <td className="p-2">{variante.talle.valor}</td><td className="p-2"><span className="inline-flex items-center gap-2"><span className="h-4 w-4 border border-black" style={{ backgroundColor: variante.color.hex }} />{variante.color.nombre}</span></td>
          <td className="p-2"><form className="flex gap-2" onSubmit={(event) => props.onGuardarStock(event, producto.id, variante)}><input name="stock" type="number" min="0" defaultValue={variante.stock} className="w-20 border border-black px-2 py-1" /><button disabled={props.procesando === `variante-${variante.id}`} className="bg-black px-3 py-1 text-xs font-bold uppercase text-white disabled:opacity-50">Guardar</button></form></td>
          <td className="p-2 uppercase">{variante.estado}</td><td className="p-2"><button type="button" onClick={() => props.onEliminarVariante(producto.id, variante.id)} disabled={props.procesando === `variante-${variante.id}`} className="text-xs font-bold uppercase text-red-700 underline disabled:opacity-50">Eliminar</button>{props.mensajes[`variante-${variante.id}`] && <p className={`mt-1 text-xs ${props.mensajes[`variante-${variante.id}`].tipo === "ok" ? "text-green-700" : "text-red-700"}`}>{props.mensajes[`variante-${variante.id}`].texto}</p>}</td>
        </tr>)}
      </tbody></table></div>
      <form onSubmit={(event) => props.onAgregarVariante(event, producto.id)} className="mt-5 grid gap-2 sm:grid-cols-5">
        <select required name="talleId" className={inputClass}><option value="">Talle</option>{props.talles.map((item) => <option key={item.id} value={item.id}>{item.valor}</option>)}</select>
        <select required name="colorId" className={inputClass}><option value="">Color</option>{props.colores.map((item) => <option key={item.id} value={item.id}>{item.nombre} - {item.hex}</option>)}</select>
        <input required name="stock" type="number" min="0" defaultValue="0" className={inputClass} />
        <select name="estado" defaultValue="activo" className={inputClass}><option value="activo">activo</option><option value="inactivo">inactivo</option></select>
        <button disabled={props.procesando === `variante-nueva-${producto.id}`} className={botonNegro}>Agregar variante</button>
      </form>
      {props.mensajes[`variante-nueva-${producto.id}`] && <p className={`mt-2 text-xs ${props.mensajes[`variante-nueva-${producto.id}`].tipo === "ok" ? "text-green-700" : "text-red-700"}`}>{props.mensajes[`variante-nueva-${producto.id}`].texto}</p>}
    </td></tr>}
  </>;
}
