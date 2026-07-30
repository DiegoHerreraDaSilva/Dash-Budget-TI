"use client";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { Dimension, Filters } from "./types";

export interface FilterState {
  filters: Filters;
  search: string;
  toggle: (dim: Dimension, value: string) => void;
  toggleMany: (dim: Dimension, values: string[]) => void;
  setOnly: (dim: Dimension, value: string) => void;
  clearDim: (dim: Dimension) => void;
  clearAll: () => void;
  setSearch: (s: string) => void;
  isActive: (dim: Dimension, value: string) => boolean;
}

export type FilterStore = UseBoundStore<StoreApi<FilterState>>;

/**
 * Fabrica de store de filtros. Existem dois namespaces independentes porque
 * "realizado" e "previsto" tem dimensoes e valores diferentes (ex.: Tipo_
 * significa Notebook/Workstation num e Renovacao/Aquisicao no outro).
 */
function createFilterStore(): FilterStore {
  return create<FilterState>((set, get) => ({
    filters: {},
    search: "",
    toggle: (dim, value) =>
      set((state) => {
        const cur = state.filters[dim] ?? [];
        const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
        const filters = { ...state.filters };
        if (next.length === 0) delete filters[dim];
        else filters[dim] = next;
        return { filters };
      }),
    toggleMany: (dim, values) =>
      set((state) => {
        const cur = state.filters[dim] ?? [];
        const allOn = values.every((v) => cur.includes(v));
        const next = allOn
          ? cur.filter((v) => !values.includes(v))
          : Array.from(new Set([...cur, ...values]));
        const filters = { ...state.filters };
        if (next.length === 0) delete filters[dim];
        else filters[dim] = next;
        return { filters };
      }),
    setOnly: (dim, value) => set((state) => ({ filters: { ...state.filters, [dim]: [value] } })),
    clearDim: (dim) =>
      set((state) => {
        const filters = { ...state.filters };
        delete filters[dim];
        return { filters };
      }),
    clearAll: () => set({ filters: {}, search: "" }),
    setSearch: (s) => set({ search: s }),
    isActive: (dim, value) => (get().filters[dim] ?? []).includes(value),
  }));
}

/** Compartilhado pelas abas Geral e Budget T.I (ambas operam no realizado). */
export const useGastoFilters = createFilterStore();

/** Exclusivo da aba Budget Previsto. */
export const usePrevistoFilters = createFilterStore();

/** Rotulos legiveis das dimensoes, para os chips de filtro. */
export const DIM_LABELS: Record<Dimension, string> = {
  categoria: "Categoria",
  tipo: "Sub-Categoria",
  marca: "Marca",
  modelo: "Modelo",
  departamento: "Departamento",
  fornecedor: "Fornecedor",
  produto: "Produto",
  mes: "Mês",
};
