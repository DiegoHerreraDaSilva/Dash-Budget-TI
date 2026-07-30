"use client";
import { create } from "zustand";
import { TODOS_ANOS, type Periodo } from "./types";

const KEY = "schwaben-budget-ano";

interface YearState {
  /** null = ainda nao resolvido (dados nao chegaram). */
  year: Periodo | null;
  setYear: (y: Periodo) => void;
  hydrate: () => void;
  /**
   * Reconcilia o periodo selecionado com os anos que realmente existem nos
   * dados. "todos" e sempre valido. Cobre primeira visita, valor salvo que nao
   * existe mais nos dados, e valor invalido gravado por engano — sem isso o
   * painel abre vazio num periodo que nao tem lancamento nenhum.
   */
  reconcile: (anos: number[], padrao: Periodo) => void;
}

export const useYearStore = create<YearState>((set, get) => ({
  year: null,
  setYear: (y) => {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, String(y));
    set({ year: y });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(KEY);
    if (raw === TODOS_ANOS) {
      set({ year: TODOS_ANOS });
      return;
    }
    const v = Number(raw);
    // Aceita so inteiro plausivel; a validacao contra os dados e no reconcile.
    if (Number.isInteger(v) && v > 1900 && v < 2200) set({ year: v });
  },
  reconcile: (anos, padrao) => {
    if (anos.length === 0) return; // dados ainda nao chegaram: nao decide nada
    const atual = get().year;
    if (atual === TODOS_ANOS) return; // acumulado e sempre valido
    if (atual !== null && anos.includes(atual)) return; // ja valido
    // Descarta o valor salvo invalido: ele nunca foi uma escolha legitima, e
    // manter no storage faria o painel "pular" para esse ano se ele passasse a
    // existir mais tarde. O padrao nao e persistido de proposito.
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
    set({ year: padrao });
  },
}));
