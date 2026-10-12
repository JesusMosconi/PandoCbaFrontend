import CarritoPanel from "@/components/CarritoPanel";
import { obtenerSesion } from "@/lib/session";

export default async function CarritoPage() {
  const usuario = await obtenerSesion();
  return <CarritoPanel rol={usuario?.rol ?? null} />;
}
