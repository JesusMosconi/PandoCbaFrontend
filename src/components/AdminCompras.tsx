"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetchAdmin } from "@/lib/api";
import type { BorradorCompraEntrada, CompraResumen, GastoCompraEntrada, LineaCompraEntrada, PaginaCompras } from "@/types/compra";
import type { PaginaProveedores } from "@/types/proveedor";
import type { Producto } from "@/types/producto";
import AdminInformes from "@/components/AdminInformes";

const campo = "w-full border border-neutral-400 bg-white px-3 py-2 text-sm";
const nuevaLinea = (): LineaCompraEntrada => ({ varianteId: 0, cantidad: 1, costoUnitario: "0.00" });
const nuevoGasto = (): GastoCompraEntrada => ({ concepto: "", importe: "0.00" });

export default function AdminCompras({ productoIdInicial }: { productoIdInicial?: number }) {
  const [proveedores, setProveedores] = useState<PaginaProveedores | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [lista, setLista] = useState<PaginaCompras | null>(null);
  const [borradorId, setBorradorId] = useState<number | null>(null);
  const [entrada, setEntrada] = useState<BorradorCompraEntrada>({
    proveedorId: 0, fechaCompra: "", fechaRecepcion: "", lineas: [nuevaLinea()], gastosAdicionales: [],
  });
  const [revision, setRevision] = useState<CompraResumen | null>(null);
  const [claveOperacion, setClaveOperacion] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [productoNuevo, setProductoNuevo] = useState({ nombre: "", precio: "", categoriaId: 0 });
  const [productoCreado, setProductoCreado] = useState("");
  const [gestion, setGestion] = useState<"correcciones" | "anulacion" | "devoluciones-proveedor">("correcciones");
  const [partidaId, setPartidaId] = useState(0);
  const [campoCorreccion, setCampoCorreccion] = useState<"cantidad" | "costoUnitario">("cantidad");
  const [valorGestion, setValorGestion] = useState("");
  const [motivoGestion, setMotivoGestion] = useState("");
  const [claveGestion, setClaveGestion] = useState("");
  const [mensajeGestion, setMensajeGestion] = useState("");

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const [paginaProveedores, catalogo, categoriasNuevas, paginaCompras] = await Promise.all([
        apiFetchAdmin<PaginaProveedores>("/proveedores?activo=true&pagina=1&limite=100"),
        apiFetchAdmin<Producto[]>("/productos?admin=true"),
        apiFetchAdmin<{ id: number; nombre: string }[]>("/categorias"),
        apiFetchAdmin<PaginaCompras>("/compras?pagina=1&limite=20"),
      ]);
      setProveedores(paginaProveedores);
      setProductos(catalogo);
      setCategorias(categoriasNuevas);
      setLista(paginaCompras);
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos cargar Compras. Reintentá.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    Promise.all([
      apiFetchAdmin<PaginaProveedores>("/proveedores?activo=true&pagina=1&limite=100"),
      apiFetchAdmin<Producto[]>("/productos?admin=true"),
      apiFetchAdmin<{ id: number; nombre: string }[]>("/categorias"),
      apiFetchAdmin<PaginaCompras>("/compras?pagina=1&limite=20"),
    ]).then(([p, prod, cat, compras]) => {
      setProveedores(p); setProductos(prod); setCategorias(cat); setLista(compras);
    }).catch((causa) => setError(causa instanceof ApiError ? causa.message : "No pudimos cargar Compras. Reintentá."))
      .finally(() => setCargando(false));
  }, []);

  function cambiarEntrada(cambios: Partial<BorradorCompraEntrada>) {
    setEntrada((anterior) => ({ ...anterior, ...cambios }));
    setRevision(null);
    setClaveOperacion("");
  }

  function cambiarLinea(indice: number, cambios: Partial<LineaCompraEntrada>) {
    cambiarEntrada({ lineas: entrada.lineas.map((linea, posicion) => posicion === indice ? { ...linea, ...cambios } : linea) });
  }

  function cambiarGasto(indice: number, cambios: Partial<GastoCompraEntrada>) {
    cambiarEntrada({ gastosAdicionales: (entrada.gastosAdicionales ?? []).map((gasto, posicion) => posicion === indice ? { ...gasto, ...cambios } : gasto) });
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      const guardado = await apiFetchAdmin<CompraResumen>(borradorId ? `/compras/${borradorId}` : "/compras", {
        method: borradorId ? "PUT" : "POST", body: JSON.stringify(entrada),
      });
      setBorradorId(guardado.id);
      const resumen = await apiFetchAdmin<CompraResumen>(`/compras/${guardado.id}/resumen`, { method: "POST", body: "{}" });
      setRevision(resumen);
      setClaveOperacion(crypto.randomUUID());
      setLista(await apiFetchAdmin<PaginaCompras>("/compras?pagina=1&limite=20"));
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos guardar el borrador. Reintentá.");
    } finally {
      setOcupado(false);
    }
  }

  async function confirmar() {
    if (!revision || !borradorId || !claveOperacion || ocupado) return;
    setOcupado(true);
    setError("");
    try {
      const confirmado = await apiFetchAdmin<CompraResumen>(`/compras/${borradorId}/confirmacion`, {
        method: "POST", body: JSON.stringify({ claveOperacion, resumenAceptado: revision.huellaResumen }),
      });
      setRevision(confirmado);
      setLista(await apiFetchAdmin<PaginaCompras>("/compras?pagina=1&limite=20"));
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos confirmar. Consultá el estado y reintentá con la misma clave.");
    } finally {
      setOcupado(false);
    }
  }

  async function abrir(id: number) {
    setError("");
    try {
      const ingreso = await apiFetchAdmin<CompraResumen>(`/compras/${id}`);
      setBorradorId(ingreso.id);
      setEntrada({
        proveedorId: ingreso.proveedorId,
        fechaCompra: ingreso.fechaCompra.slice(0, 10),
        fechaRecepcion: ingreso.fechaRecepcion.slice(0, 10),
        lineas: ingreso.lineas.filter((linea) => linea.activo).map(({ varianteId, cantidad, costoUnitario }) => ({ varianteId, cantidad, costoUnitario })),
        gastosAdicionales: ingreso.gastosCompra.filter((gasto) => gasto.activo).map(({ concepto, importe }) => ({ concepto, importe })),
      });
      setRevision(ingreso.estado === "confirmado" ? ingreso : null);
      setClaveOperacion("");
      setPartidaId(ingreso.partidas?.[0]?.id ?? 0);
      setValorGestion(""); setMotivoGestion(""); setClaveGestion(""); setMensajeGestion("");
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos abrir el ingreso. Reintentá.");
    }
  }

  async function ejecutarGestion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!borradorId || ocupado || !confirmado) return;
    const clave = claveGestion || crypto.randomUUID();
    setClaveGestion(clave);
    const valorNuevo = campoCorreccion === "cantidad" ? Number(valorGestion) : valorGestion;
    const body = gestion === "anulacion" ? { motivo: motivoGestion.trim(), claveOperacion: clave }
      : gestion === "correcciones" ? { partidaId, campo: campoCorreccion, valorNuevo,
        motivo: motivoGestion.trim(), claveOperacion: clave }
        : { partidaId, cantidad: Number(valorGestion), motivo: motivoGestion.trim(), claveOperacion: clave };
    if (!window.confirm(`¿Registrar ${gestion.replaceAll("-", " ")} en el ingreso #${borradorId}?`)) return;
    setOcupado(true); setError(""); setMensajeGestion("");
    try {
      await apiFetchAdmin(`/compras/${borradorId}/${gestion}`, { method: "POST", body: JSON.stringify(body) });
      const ingreso = await apiFetchAdmin<CompraResumen>(`/compras/${borradorId}`);
      setRevision(ingreso);
      setLista(await apiFetchAdmin<PaginaCompras>("/compras?pagina=1&limite=20"));
      setMensajeGestion("Operación registrada. Revisá los eventos y saldos actualizados.");
      setClaveGestion(crypto.randomUUID()); setValorGestion(""); setMotivoGestion("");
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos confirmar la operación. Revisá el ingreso y reintentá con la misma clave.");
    } finally { setOcupado(false); }
  }

  async function crearProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      const creado = await apiFetchAdmin<Producto>("/compras/productos", {
        method: "POST",
        body: JSON.stringify({ nombre: productoNuevo.nombre, precio: Number(productoNuevo.precio), categoriaId: productoNuevo.categoriaId }),
      });
      setProductoCreado(`Ficha ${creado.nombre} creada sin publicar. Agregá una variante con stock cero desde Productos.`);
      setProductos(await apiFetchAdmin<Producto[]>("/productos?admin=true"));
      setProductoNuevo({ nombre: "", precio: "", categoriaId: 0 });
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos crear la ficha. Reintentá.");
    } finally {
      setOcupado(false);
    }
  }

  const variantes = productos.flatMap((producto) => producto.talles.map((variante) => ({
    id: variante.id,
    etiqueta: `${producto.nombre} · ${variante.talle.valor} · ${variante.color.nombre}`,
  })));
  const confirmado = revision?.estado === "confirmado";

  return <div className="space-y-6">
    {error && <div role="alert" className="border border-red-700 bg-red-50 p-4 text-sm text-red-800">
      {error} <button type="button" className="ml-3 underline" onClick={cargar}>Reintentar carga</button>
    </div>}
    {cargando ? <p role="status">Cargando compras…</p> : <section className="border border-black bg-white p-5">
      <h2 className="font-epilogue text-xl font-black uppercase">Ingresos</h2>
      {lista?.datos.length === 0 ? <p className="mt-3 text-sm text-neutral-600">Aún no hay ingresos.</p> : <ul className="mt-3 divide-y divide-neutral-200">
        {lista?.datos.map((ingreso) => <li key={ingreso.id}>
          <button type="button" className="w-full py-3 text-left text-sm hover:underline" onClick={() => abrir(ingreso.id)}>
            Ingreso #{ingreso.id} · {ingreso.fechaRecepcion.slice(0, 10)} · {ingreso.estado}
          </button>
        </li>)}
      </ul>}
      <button type="button" className="mt-3 text-sm underline" onClick={() => {
        setBorradorId(null); setEntrada({ proveedorId: 0, fechaCompra: "", fechaRecepcion: "", lineas: [nuevaLinea()], gastosAdicionales: [] });
        setRevision(null); setClaveOperacion("");
      }}>Nuevo ingreso</button>
    </section>}

    <section className="border border-black bg-white p-5">
      <h2 className="font-epilogue text-xl font-black uppercase">{borradorId ? `Ingreso #${borradorId}` : "Nuevo ingreso"}</h2>
      <form onSubmit={guardar} className="mt-5 space-y-5">
        <label className="block text-sm font-semibold">Proveedor
          <select className={`${campo} mt-1`} value={entrada.proveedorId || ""} onChange={(e) => cambiarEntrada({ proveedorId: Number(e.target.value) })} required disabled={confirmado}>
            <option value="">Seleccioná un proveedor</option>
            {proveedores?.datos.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Fecha de compra
            <input type="date" className={`${campo} mt-1`} value={entrada.fechaCompra} onChange={(e) => cambiarEntrada({ fechaCompra: e.target.value })} required disabled={confirmado} />
          </label>
          <label className="text-sm font-semibold">Fecha de recepción
            <input type="date" className={`${campo} mt-1`} value={entrada.fechaRecepcion} onChange={(e) => cambiarEntrada({ fechaRecepcion: e.target.value })} required disabled={confirmado} />
          </label>
        </div>
        <div>
          <h3 className="font-semibold">Variantes recibidas</h3>
          {entrada.lineas.map((linea, indice) => <div key={indice} className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
            <label className="text-xs font-semibold">Variante
              <select className={`${campo} mt-1`} value={linea.varianteId || ""} onChange={(e) => cambiarLinea(indice, { varianteId: Number(e.target.value) })} required disabled={confirmado}>
                <option value="">Seleccioná una variante</option>
                {variantes.map((variante) => <option key={variante.id} value={variante.id}>{variante.etiqueta}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold">Cantidad
              <input type="number" min={1} step={1} className={`${campo} mt-1`} value={linea.cantidad} onChange={(e) => cambiarLinea(indice, { cantidad: Number(e.target.value) })} required disabled={confirmado} />
            </label>
            <label className="text-xs font-semibold">Costo unitario
              <input type="text" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" className={`${campo} mt-1`} value={linea.costoUnitario} onChange={(e) => cambiarLinea(indice, { costoUnitario: e.target.value })} required disabled={confirmado} />
            </label>
            {!confirmado && <button type="button" className="self-end text-xs underline" disabled={entrada.lineas.length === 1} onClick={() => cambiarEntrada({ lineas: entrada.lineas.filter((_, posicion) => posicion !== indice) })}>Quitar</button>}
          </div>)}
          {!confirmado && <button type="button" className="mt-3 text-sm underline" onClick={() => cambiarEntrada({ lineas: [...entrada.lineas, nuevaLinea()] })}>Agregar variante</button>}
        </div>
        <div>
          <h3 className="font-semibold">Gastos adicionales</h3>
          {(entrada.gastosAdicionales ?? []).map((gasto, indice) => <div key={indice} className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
            <label className="text-xs font-semibold">Concepto
              <input className={`${campo} mt-1`} value={gasto.concepto} onChange={(e) => cambiarGasto(indice, { concepto: e.target.value })} required disabled={confirmado} />
            </label>
            <label className="text-xs font-semibold">Importe
              <input type="text" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" className={`${campo} mt-1`} value={gasto.importe} onChange={(e) => cambiarGasto(indice, { importe: e.target.value })} required disabled={confirmado} />
            </label>
            {!confirmado && <button type="button" className="self-end text-xs underline" onClick={() => cambiarEntrada({ gastosAdicionales: (entrada.gastosAdicionales ?? []).filter((_, posicion) => posicion !== indice) })}>Quitar</button>}
          </div>)}
          {!confirmado && <button type="button" className="mt-3 text-sm underline" onClick={() => cambiarEntrada({ gastosAdicionales: [...(entrada.gastosAdicionales ?? []), nuevoGasto()] })}>Agregar gasto</button>}
        </div>
        {!confirmado && <button disabled={ocupado} className="bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{ocupado ? "Guardando…" : "Guardar y revisar"}</button>}
      </form>
      {revision && <div className="mt-8 border-t border-black pt-5">
        <h3 className="font-epilogue text-lg font-black uppercase">Resumen de recepción</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt>Mercadería</dt><dd className="font-semibold">${revision.importeMercaderia}</dd></div>
          <div><dt>Gastos</dt><dd className="font-semibold">${revision.gastosAdicionales}</dd></div>
          <div><dt>Total desembolsado</dt><dd className="font-semibold">${revision.totalDesembolso}</dd></div>
        </dl>
        {confirmado ? <p role="status" className="mt-4 font-semibold">Recepción confirmada; el stock se actualizó una vez.</p> : <button type="button" disabled={ocupado} onClick={confirmar} className="mt-5 border border-black px-5 py-2 text-sm font-semibold disabled:opacity-50">Confirmar recepción</button>}
      </div>}
      {confirmado && revision && <section className="mt-8 border-t border-black pt-5" aria-label="Correcciones y devoluciones de ingreso">
        <h3 className="font-epilogue text-lg font-black uppercase">Corregir o devolver</h3>
        <p className="mt-2 text-sm">Revisá la partida y el motivo. Las unidades comprometidas no pueden retirarse.</p>
        <form onSubmit={ejecutarGestion} className="mt-4 grid gap-3">
          <label className="text-sm">Operación
            <select className={`${campo} mt-1`} value={gestion} onChange={(e) => { setGestion(e.target.value as typeof gestion); setClaveGestion(""); setValorGestion(""); }}>
              <option value="correcciones">Corrección</option><option value="devoluciones-proveedor">Devolución a proveedor</option><option value="anulacion">Anular ingreso</option>
            </select>
          </label>
          {gestion !== "anulacion" && <label className="text-sm">Partida
            <select className={`${campo} mt-1`} value={partidaId || ""} onChange={(e) => { setPartidaId(Number(e.target.value)); setClaveGestion(""); }} required>
              <option value="">Seleccioná una partida</option>
              {revision.partidas?.map((partida) => <option key={partida.id} value={partida.id}>#{partida.id} · variante #{partida.varianteId} · {partida.cantidadOriginal} unidades · costo ${partida.costoUnitario ?? "desconocido"}</option>)}
            </select>
          </label>}
          {gestion === "correcciones" && <label className="text-sm">Campo
            <select className={`${campo} mt-1`} value={campoCorreccion} onChange={(e) => { setCampoCorreccion(e.target.value as typeof campoCorreccion); setValorGestion(""); setClaveGestion(""); }}>
              <option value="cantidad">Cantidad original</option><option value="costoUnitario">Costo unitario</option>
            </select>
          </label>}
          {gestion !== "anulacion" && <label className="text-sm">{gestion === "correcciones" ? "Valor nuevo" : "Cantidad a devolver"}
            <input className={`${campo} mt-1`} type={gestion === "devoluciones-proveedor" || campoCorreccion === "cantidad" ? "number" : "text"}
              min={gestion === "devoluciones-proveedor" ? 1 : 0} step={1} value={valorGestion}
              onChange={(e) => { setValorGestion(e.target.value); setClaveGestion(""); }} required />
          </label>}
          <label className="text-sm">Motivo
            <textarea className={`${campo} mt-1`} value={motivoGestion} onChange={(e) => { setMotivoGestion(e.target.value); setClaveGestion(""); }} maxLength={500} required />
          </label>
          <button disabled={ocupado || !motivoGestion.trim() || (gestion !== "anulacion" && (!partidaId || !valorGestion))}
            className="w-fit border border-black px-4 py-2 text-sm font-bold disabled:opacity-40">{ocupado ? "Registrando…" : "Revisar y registrar"}</button>
        </form>
        {mensajeGestion && <p role="status" className="mt-3 text-sm">{mensajeGestion}</p>}
        {!!revision.correcciones?.length && <ul className="mt-4 text-sm">{revision.correcciones.map((item) => <li key={item.id}>Corrección #{item.id} · {item.campo} · {item.valorAnterior} → {item.valorNuevo} · {item.motivo}</li>)}</ul>}
        {!!revision.devolucionesProveedor?.length && <ul className="mt-4 text-sm">{revision.devolucionesProveedor.map((item) => <li key={item.id}>Devolución #{item.id} · partida #{item.partidaId} · {item.cantidad} unidades · {item.motivo}</li>)}</ul>}
      </section>}
    </section>

    <section className="border border-black bg-white p-5">
      <h2 className="font-epilogue text-xl font-black uppercase">Crear ficha desde Compras</h2>
      <p className="mt-2 text-sm text-neutral-600">La ficha nace sin publicar y sin stock. Luego agregá sus variantes con stock cero desde Productos.</p>
      <form onSubmit={crearProducto} className="mt-4 grid gap-3 sm:grid-cols-4">
        <label className="text-xs font-semibold">Nombre
          <input className={`${campo} mt-1`} value={productoNuevo.nombre} onChange={(e) => setProductoNuevo({ ...productoNuevo, nombre: e.target.value })} required />
        </label>
        <label className="text-xs font-semibold">Precio de venta
          <input type="number" min={0} step="0.01" className={`${campo} mt-1`} value={productoNuevo.precio} onChange={(e) => setProductoNuevo({ ...productoNuevo, precio: e.target.value })} required />
        </label>
        <label className="text-xs font-semibold">Categoría
          <select className={`${campo} mt-1`} value={productoNuevo.categoriaId || ""} onChange={(e) => setProductoNuevo({ ...productoNuevo, categoriaId: Number(e.target.value) })} required>
            <option value="">Seleccioná</option>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
          </select>
        </label>
        <button disabled={ocupado} className="self-end bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Crear ficha</button>
      </form>
      {productoCreado && <p role="status" className="mt-3 text-sm">{productoCreado} <Link href="/admin/productos" className="underline">Ir a Productos</Link></p>}
    </section>
    <AdminInformes productoIdInicial={productoIdInicial}
      productos={productos.map((producto) => ({ id: producto.id, nombre: producto.nombre }))}
      variantes={variantes.map((variante) => ({ id: variante.id, nombre: variante.etiqueta }))}
      proveedores={proveedores?.datos.map((proveedor) => ({ id: proveedor.id, nombre: proveedor.nombre })) ?? []} />
  </div>;
}
