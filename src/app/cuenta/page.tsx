import CuentaPanel from "@/components/CuentaPanel";
import { obtenerSesion } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CuentaPage() {
  const usuario = await obtenerSesion();
  if (!usuario) redirect("/login");

  return <CuentaPanel usuarioInicial={usuario} />;
}
