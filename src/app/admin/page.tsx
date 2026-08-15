import { redirect } from "next/navigation";
import { exigirAdministrador } from "@/lib/autorizacion";

export default async function AdminPage() {
  await exigirAdministrador();
  redirect("/admin/imagenes");
}
