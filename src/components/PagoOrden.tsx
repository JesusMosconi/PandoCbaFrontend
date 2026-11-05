"use client";
import { useEffect, useState } from "react";
import { ApiError, apiFetchInterna } from "@/lib/api";
import type { EstadoPagoOrden } from "@/types/orden";

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const etiquetas: Record<string, string> = { sin_iniciar: "Todavía no iniciaste el pago de prueba",
  pendiente: "Pago de prueba pendiente de verificación", aprobado: "Pago de prueba aprobado",
  rechazado: "Pago de prueba rechazado", incidencia: "El pago de prueba requiere revisión de administración" };

export default function PagoOrden({ ordenId, vigente }: { ordenId: number; vigente: boolean }) {
  const [estado, setEstado] = useState<EstadoPagoOrden | null>(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    const control = new AbortController();
    let consultando = false;
    async function consultar() {
      if (consultando || control.signal.aborted) return;
      consultando = true;
      try {
        const actual = await apiFetchInterna<EstadoPagoOrden>(`/api/ordenes/${ordenId}/pago`, { signal: control.signal, cache: "no-store" });
        if (!control.signal.aborted) { setEstado(actual); setError(""); }
      } catch {
        if (!control.signal.aborted) setError("No pudimos verificar el pago. Se volverá a consultar; evitá iniciar otra compra.");
      } finally {
        consultando = false;
      }
    }
    void consultar();
    const intervalo = window.setInterval(() => { if (navigator.onLine) void consultar(); }, 15000);
    return () => { control.abort(); window.clearInterval(intervalo); };
  }, [ordenId]);
  async function pagar() {
    if (ocupado) return;
    setOcupado(true); setError("");
    try {
      const respuesta = await apiFetchInterna<{ urlCheckout: string }>(`/api/ordenes/${ordenId}/pagos`, { method: "POST", body: "{}" });
      const url = new URL(respuesta.urlCheckout);
      if (url.protocol !== "https:" || url.hostname !== "www.mercadopago.com.ar" || url.port
        || url.username || url.password || !url.pathname.startsWith("/checkout/")) {
        throw new Error("Destino inválido");
      }
      window.location.assign(url.href);
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : "No pudimos abrir el pago. Reintentá esta misma orden.");
      setOcupado(false);
    }
  }
  return <section aria-label="Pago de demostración" className="mt-5 border border-amber-700 p-4">
    <p className="font-semibold">Demostración: sin dinero real</p>
    <p role="status" className="mt-2">{estado ? etiquetas[estado.estadoPago] ?? "Verificando pago de prueba" : "Consultando pago de prueba…"}</p>
    {estado && Number(estado.saldoMonetarioPendiente) > 0 && <p className="mt-2">Reintegro simulado pendiente: {moneda.format(Number(estado.saldoMonetarioPendiente))}</p>}
    {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
    {vigente && estado && ["sin_iniciar", "rechazado", "pendiente"].includes(estado.estadoPago) && <button type="button"
      disabled={ocupado} onClick={() => void pagar()} className="mt-3 bg-black px-4 py-3 text-white disabled:opacity-40">
      {ocupado ? "Abriendo…" : estado.estadoPago === "pendiente" ? "Continuar pago de prueba" : "Pagar con Mercado Pago (prueba)"}
    </button>}
  </section>;
}
