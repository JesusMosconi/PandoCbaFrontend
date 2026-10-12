import { redirect } from "next/navigation";
import CheckoutPanel from "@/components/CheckoutPanel";
import { obtenerSesion } from "@/lib/session";

export default async function CheckoutPage() {
  const usuario = await obtenerSesion();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "cliente") redirect("/carrito");
  return <CheckoutPanel />;
}
