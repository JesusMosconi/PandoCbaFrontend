import type { CampoInvalido, ErrorOrden, ItemAfectado, ResumenCheckout } from "@/types/orden";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  codigo?: string;
  itemsAfectados?: ItemAfectado[];
  camposInvalidos?: CampoInvalido[];
  resumen?: ResumenCheckout;

  constructor(message: string, status: number, detalles: Partial<ErrorOrden> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.codigo = detalles.codigo;
    this.itemsAfectados = detalles.itemsAfectados;
    this.camposInvalidos = detalles.camposInvalidos;
    this.resumen = detalles.resumen;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(error.message || `Error ${res.status}`, res.status, error);
  }

  return res.json();
}

export async function apiFetchInterna<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(endpoint, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(error.message || `Error ${res.status}`, res.status, error);
  }

  return res.json();
}

/** Solo para rutas BFF: conserva la respuesta HTTP original de Express. */
export async function reenviarAExpress(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  if (typeof window !== "undefined") throw new Error("Reenvío disponible solo en el servidor");
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base || !/^https?:\/\//u.test(base)) throw new Error("API interna no configurada");
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${base.replace(/\/$/u, "")}/${endpoint.replace(/^\//u, "")}`, {
    ...options,
    headers,
    cache: "no-store",
    redirect: "manual",
  });
}

/** Envía operaciones administrativas mediante el proxy que valida la sesión httpOnly. */
export function apiFetchAdmin<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiFetchInterna<T>(`/api/admin${endpoint}`, options);
}
