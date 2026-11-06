import {
  BarChart3, ClipboardList, Home, ImageIcon, Layers3, LayoutGrid, Package, ShoppingBag, Store, Trophy, Truck, Users,
  type LucideIcon,
} from "lucide-react";

export type ModuloAdmin = {
  href: string;
  titulo: string;
  icono: LucideIcon;
};

export type GrupoAdmin = { titulo: string; modulos: ModuloAdmin[] };

/** Módulos del panel, agrupados como se muestran en el menú lateral. */
export const GRUPOS_ADMIN: GrupoAdmin[] = [
  {
    titulo: "Ventas",
    modulos: [
      { href: "/admin/ordenes", titulo: "Órdenes", icono: ClipboardList },
      { href: "/admin/ventas", titulo: "Ventas por canal", icono: BarChart3 },
      { href: "/admin/ranking", titulo: "Ranking", icono: Trophy },
    ],
  },
  {
    titulo: "Catálogo",
    modulos: [
      { href: "/admin/productos", titulo: "Productos", icono: Package },
      { href: "/admin/drops", titulo: "Drops", icono: Layers3 },
      { href: "/admin/catalogo-inicio", titulo: "Catálogo de Inicio", icono: LayoutGrid },
      { href: "/admin/imagenes", titulo: "Imágenes", icono: ImageIcon },
    ],
  },
  {
    titulo: "Inventario",
    modulos: [
      { href: "/admin/proveedores", titulo: "Proveedores", icono: Truck },
      { href: "/admin/compras", titulo: "Compras", icono: ShoppingBag },
    ],
  },
  {
    titulo: "Usuarios",
    modulos: [
      { href: "/admin/clientes", titulo: "Clientes", icono: Users },
    ],
  },
];

/** Enlaces fijos del menú, fuera de los grupos. */
export const INICIO_ADMIN = { href: "/admin", titulo: "Inicio", icono: Home };
export const PUNTO_VENTA = { href: "/vendedor", titulo: "Punto de venta", icono: Store };
