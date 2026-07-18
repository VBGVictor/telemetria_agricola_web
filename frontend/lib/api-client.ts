import type { ApiErrorBody, DaySummary, Machine, MachineSummary, PaginatedEvents } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export type MachineInput = {
  code: string;
  name: string;
  type: Machine["type"];
  model: string;
  brand: string;
  year: number;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(body?.error ?? `Erro ao chamar ${path} (status ${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function fetchMachines(filters: { search?: string; type?: string }): Promise<Machine[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  const query = params.toString();
  return apiFetch<Machine[]>(`/machines${query ? `?${query}` : ""}`);
}

export function createMachine(input: MachineInput): Promise<Machine> {
  return apiFetch<Machine>("/machines", { method: "POST", body: JSON.stringify(input) });
}

export function updateMachine(id: string, input: MachineInput): Promise<Machine> {
  return apiFetch<Machine>(`/machines/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteMachine(id: string): Promise<void> {
  return apiFetch<void>(`/machines/${id}`, { method: "DELETE" });
}

export function fetchMachineEvents(
  machineId: string,
  params: { page?: number; limit?: number; from?: string; to?: string }
): Promise<PaginatedEvents> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const query = search.toString();
  return apiFetch<PaginatedEvents>(`/machines/${machineId}/events${query ? `?${query}` : ""}`);
}

export function fetchSummary(period: { from?: string; to?: string }): Promise<MachineSummary[]> {
  const params = new URLSearchParams();
  if (period.from) params.set("from", period.from);
  if (period.to) params.set("to", period.to);
  const query = params.toString();
  return apiFetch<MachineSummary[]>(`/summary${query ? `?${query}` : ""}`);
}

export function fetchDailySummary(period: { from?: string; to?: string }): Promise<DaySummary[]> {
  const params = new URLSearchParams();
  if (period.from) params.set("from", period.from);
  if (period.to) params.set("to", period.to);
  const query = params.toString();
  return apiFetch<DaySummary[]>(`/summary/daily${query ? `?${query}` : ""}`);
}
