import type { ProductosFiltros, ProductosResponse } from "./types";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
function productosQuery({ categoriaId, talle, orden, page = 1, pageSize = 6 }: ProductosFiltros) { const params = new URLSearchParams({ categoriaId: String(categoriaId), web: "true", page: String(page), pageSize: String(pageSize) }); if (talle) params.set("talle", talle); if (orden) params.set("orden", orden); return params.toString(); }
export async function getProductos(filtros: ProductosFiltros): Promise<ProductosResponse> { const apiUrl = process.env.API_URL; if (!apiUrl) throw new Error("Falta configurar API_URL."); const response = await fetch(`${apiUrl}/productos?${productosQuery(filtros)}`, { next: { revalidate: 60 } }); if (!response.ok) throw new Error("No se pudieron obtener los productos."); return response.json(); }
export async function getProductosClient(filtros: ProductosFiltros): Promise<ProductosResponse> { if (!API_URL) throw new Error("Falta configurar NEXT_PUBLIC_API_URL."); const response = await fetch(`${API_URL}/productos?${productosQuery(filtros)}`); if (!response.ok) throw new Error("No se pudieron obtener los productos."); return response.json(); }

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Error ${res.status}`);
  }

  return res.json();
}
