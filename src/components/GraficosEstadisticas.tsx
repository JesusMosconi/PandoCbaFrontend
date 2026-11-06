"use client";

import type { ReactElement } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { COLOR_PRINCIPAL, COLOR_SECUNDARIO, COLOR_SERIE, dineroCompacto, fechaCorta, fechaLarga } from "@/lib/estadisticas";
import { formatearDinero } from "@/lib/venta-local";

const TEXTO = "#0b0b0b";
const TEXTO_SECUNDARIO = "#52514e";
const GRILLA = "#e5e5e5";
const eje = { fontSize: 11, fill: TEXTO_SECUNDARIO };
const tooltip = {
  contentStyle: { border: "1px solid #000", borderRadius: 0, fontSize: 12 },
  itemStyle: { color: TEXTO },
  labelStyle: { color: TEXTO, fontWeight: 700 },
};
const leyenda = { wrapperStyle: { fontSize: 12, color: TEXTO } };
const dinero = (valor: unknown) => formatearDinero(Number(valor));

function Marco({ titulo, alto = 260, children }: { titulo: string; alto?: number; children: ReactElement }) {
  return <figure className="border border-black bg-white p-4">
    <figcaption className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">{titulo}</figcaption>
    <div className="mt-3" style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  </figure>;
}

/** Vista de tabla accesible para los mismos datos del gráfico. */
export function TablaGrafico({ columnas, filas }: { columnas: string[]; filas: (string | number)[][] }) {
  return <details className="mt-2 text-sm">
    <summary className="cursor-pointer underline">Ver como tabla</summary>
    <div className="mt-2 max-h-64 overflow-auto border border-neutral-300 bg-white">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-white text-xs uppercase"><tr>{columnas.map((columna) => <th key={columna} className="p-2">{columna}</th>)}</tr></thead>
        <tbody className="divide-y">{filas.map((fila, indice) => <tr key={indice}>
          {fila.map((celda, posicion) => <td key={posicion} className="p-2">{celda}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </details>;
}

type PuntoVentas = { fecha: string; web: number; local: number };

export function GraficoVentasDiarias({ serie, alto }: { serie: PuntoVentas[]; alto?: number }) {
  // Barras apiladas: con días sin ventas, una curva suavizada inventaría valores entre puntos.
  return <Marco titulo="Ventas por día y canal" alto={alto}>
    <BarChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
      <CartesianGrid vertical={false} stroke={GRILLA} />
      <XAxis dataKey="fecha" tickFormatter={fechaCorta} tick={eje} tickLine={false} axisLine={{ stroke: GRILLA }} minTickGap={16} />
      <YAxis tickFormatter={dineroCompacto} tick={eje} tickLine={false} axisLine={false} width={64} />
      <Tooltip {...tooltip} formatter={dinero} labelFormatter={(fecha) => fechaLarga(String(fecha))} cursor={{ fill: "#f5f5f5" }} />
      <Legend {...leyenda} />
      <Bar dataKey="web" name="Web" stackId="ventas" fill={COLOR_SERIE.web} maxBarSize={28} stroke="#fff" strokeWidth={1} />
      <Bar dataKey="local" name="Local" stackId="ventas" fill={COLOR_SERIE.local} maxBarSize={28} stroke="#fff" strokeWidth={1}
        radius={[4, 4, 0, 0]} />
    </BarChart>
  </Marco>;
}

type BarraRanking = { nombre: string; valor: number };

export function GraficoTopRanking({ filas, metrica }: { filas: BarraRanking[]; metrica: "unidades" | "importe" }) {
  const formato = metrica === "importe" ? dinero : (valor: unknown) => `${Number(valor)} u.`;
  return <Marco titulo={`Top ${filas.length} por ${metrica === "importe" ? "importe neto" : "unidades netas"}`} alto={Math.max(160, filas.length * 30 + 40)}>
    <BarChart data={filas} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
      <CartesianGrid horizontal={false} stroke={GRILLA} />
      <XAxis type="number" tick={eje} tickLine={false} axisLine={false}
        tickFormatter={metrica === "importe" ? dineroCompacto : undefined} allowDecimals={false} />
      <YAxis type="category" dataKey="nombre" tick={eje} tickLine={false} axisLine={{ stroke: GRILLA }} width={160}
        tickFormatter={(nombre: string) => (nombre.length > 24 ? `${nombre.slice(0, 23)}…` : nombre)} />
      <Tooltip {...tooltip} formatter={formato} cursor={{ fill: "#f5f5f5" }} />
      <Bar dataKey="valor" name={metrica === "importe" ? "Importe neto" : "Unidades netas"}
        fill={COLOR_PRINCIPAL} barSize={14} radius={[0, 4, 4, 0]} />
    </BarChart>
  </Marco>;
}

type PuntoPrecio = { fecha: string; publicado: number | null; cobrado: number | null };

export function GraficoPrecios({ serie }: { serie: PuntoPrecio[] }) {
  return <Marco titulo="Precio publicado y precio promedio cobrado">
    <LineChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
      <CartesianGrid vertical={false} stroke={GRILLA} />
      <XAxis dataKey="fecha" tickFormatter={fechaCorta} tick={eje} tickLine={false} axisLine={{ stroke: GRILLA }} minTickGap={16} />
      {/* Desde cero: con un precio estable, un eje ajustado repetiría la misma etiqueta. */}
      <YAxis tickFormatter={dineroCompacto} tick={eje} tickLine={false} axisLine={false} width={64} domain={[0, "auto"]} />
      <Tooltip {...tooltip} formatter={dinero} labelFormatter={(fecha) => fechaLarga(String(fecha))}
        cursor={{ stroke: TEXTO_SECUNDARIO, strokeDasharray: "3 3" }} />
      <Legend {...leyenda} />
      <Line type="stepAfter" dataKey="publicado" name="Precio publicado" stroke={COLOR_PRINCIPAL} strokeWidth={2}
        dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} connectNulls={false} />
      {/* Solo puntos: el promedio cobrado existe en los días con ventas y no debe tapar el precio publicado. */}
      <Line type="linear" dataKey="cobrado" name="Promedio cobrado" stroke={COLOR_SECUNDARIO} strokeWidth={0} legendType="circle"
        dot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: COLOR_SECUNDARIO }} activeDot={{ r: 5 }} />
    </LineChart>
  </Marco>;
}

type PuntoUnidades = { fecha: string; unidades: number };

export function GraficoUnidadesDiarias({ serie }: { serie: PuntoUnidades[] }) {
  return <Marco titulo="Unidades netas por día">
    <BarChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
      <CartesianGrid vertical={false} stroke={GRILLA} />
      <XAxis dataKey="fecha" tickFormatter={fechaCorta} tick={eje} tickLine={false} axisLine={{ stroke: GRILLA }} minTickGap={16} />
      <YAxis tick={eje} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
      <Tooltip {...tooltip} formatter={(valor) => `${Number(valor)} u.`} labelFormatter={(fecha) => fechaLarga(String(fecha))}
        cursor={{ fill: "#f5f5f5" }} />
      <Bar dataKey="unidades" name="Unidades netas" fill={COLOR_PRINCIPAL} maxBarSize={18} radius={[4, 4, 0, 0]} />
    </BarChart>
  </Marco>;
}
