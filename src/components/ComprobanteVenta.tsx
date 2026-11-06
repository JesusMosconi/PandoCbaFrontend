import { etiquetaMedioPago, formatearDinero, formatearFechaHora } from "@/lib/venta-local";
import type { VentaLocal } from "@/types/venta-local";

export default function ComprobanteVenta({ venta }: { venta: VentaLocal }) {
  return (
    <article className="mx-auto max-w-md border-2 border-black bg-white p-6 font-manrope text-sm print:max-w-none print:border-0 print:p-0">
      <header className="border-b-2 border-dashed border-black pb-4 text-center">
        <p className="font-epilogue text-xl font-black tracking-tighter">PANDO CBA</p>
        <p className="text-xs">Av. Mahatma Gandhi 300 · Córdoba</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest">Comprobante interno</p>
        <p className="font-epilogue text-2xl font-black">N.º {String(venta.numeroComprobante).padStart(6, "0")}</p>
      </header>

      <dl className="grid grid-cols-2 gap-y-1 border-b-2 border-dashed border-black py-3 text-xs">
        <dt className="font-bold uppercase">Fecha</dt><dd className="text-right">{formatearFechaHora(venta.fecha)}</dd>
        {venta.nombreCliente && <><dt className="font-bold uppercase">Cliente</dt><dd className="text-right">{venta.nombreCliente}</dd></>}
        {venta.telefonoCliente && <><dt className="font-bold uppercase">Teléfono</dt><dd className="text-right">{venta.telefonoCliente}</dd></>}
        <dt className="font-bold uppercase">Medio de pago</dt><dd className="text-right">{etiquetaMedioPago(venta.metodoPago)}</dd>
      </dl>

      <table className="w-full border-b-2 border-dashed border-black text-xs">
        <thead>
          <tr className="text-left uppercase"><th className="py-2">Producto</th><th className="py-2 text-center">Cant.</th><th className="py-2 text-right">Importe</th></tr>
        </thead>
        <tbody>
          {venta.lineas.map((linea, indice) => (
            <tr key={indice} className="align-top">
              <td className="py-1">
                <p className="font-bold">{linea.nombreProducto}</p>
                <p className="text-neutral-600">{linea.ventaRapida ? "" : `${linea.talle} · ${linea.color} · `}{formatearDinero(linea.precioUnitario)} c/u</p>
              </td>
              <td className="py-1 text-center">{linea.cantidad}</td>
              <td className="py-1 text-right">{formatearDinero(linea.importeLinea)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-baseline justify-between py-4">
        <span className="font-bold uppercase tracking-widest">Total</span>
        <span className="font-epilogue text-2xl font-black">{formatearDinero(venta.total)}</span>
      </div>
      <p className="text-center text-[10px] uppercase tracking-widest text-neutral-600">Documento no válido como factura</p>
    </article>
  );
}
