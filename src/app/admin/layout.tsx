import AdminSidebar from "@/components/AdminSidebar";
import { exigirAdministrador } from "@/lib/autorizacion";

/** Envuelve todas las páginas de /admin con el menú lateral. Cada página sigue validando el rol. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdministrador();

  return <div className="flex min-h-screen flex-col bg-neutral-100 lg:flex-row">
    <AdminSidebar />
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}
