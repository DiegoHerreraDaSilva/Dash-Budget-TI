"use client";
import { useEffect, useMemo, useState } from "react";
import { applyFilters, totalValor } from "./analytics";
import { useGastoFilters, usePrevistoFilters, type FilterStore } from "./store";
import { TODOS_ANOS, type BudgetPayload, type Gasto, type Periodo, type Previsto } from "./types";
import { useYearStore } from "./year";

// Cache em memoria compartilhado entre as tres abas: busca uma vez, trocar de
// aba reaproveita na hora. "Atualizar" (ou F5) rebusca e TODAS as instancias
// montadas re-renderizam, sem precisar de F5.
interface Snapshot extends BudgetPayload {}

let cache: Snapshot | null = null;
let loadingState = false;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

const EMPTY: Snapshot = { gastos: [], previstos: [], metas: [], source: "seed", error: null };

function notify() {
  subscribers.forEach((cb) => cb());
}

function loadShared(): Promise<void> {
  if (inFlight) return inFlight;
  loadingState = true;
  notify();
  inFlight = fetch(`/api/budget?t=${Date.now()}`, { cache: "no-store" })
    .then((r) => r.json())
    .then((data: BudgetPayload) => {
      cache = {
        gastos: data.gastos ?? [],
        previstos: data.previstos ?? [],
        metas: data.metas ?? [],
        source: data.source ?? "seed",
        error: data.error ?? null,
      };
    })
    .catch((e) => {
      cache = { ...(cache ?? EMPTY), error: String(e) };
    })
    .finally(() => {
      loadingState = false;
      inFlight = null;
      notify();
    });
  return inFlight;
}

interface State extends Snapshot {
  loading: boolean;
  refresh: () => void;
  /** true quando a primeira busca ja voltou (com dados ou com erro). */
  carregado: boolean;
  /** Anos com dados em qualquer das tres listas, desc. */
  anos: number[];
  /**
   * Periodo selecionado — um ano que existe nos dados, "todos" (acumulado), ou
   * null enquanto a busca nao voltou (ou se as tres listas estiverem vazias).
   */
  ano: Periodo | null;
  /**
   * Teto de budget do periodo. Para um ano, a meta daquele ano; para "todos",
   * a soma das metas de todos os anos cadastrados. null se nao houver nenhuma.
   */
  meta: number | null;
}

export function useBudget(): State {
  const [, forceRender] = useState(0);
  const yearRaw = useYearStore((s) => s.year);
  const reconcile = useYearStore((s) => s.reconcile);
  const hydrate = useYearStore((s) => s.hydrate);

  useEffect(() => {
    const cb = () => forceRender((n) => n + 1);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!cache && !inFlight) loadShared();
  }, []);

  const snap = cache ?? EMPTY;

  const anos = useMemo(() => {
    const set = new Set<number>();
    for (const g of snap.gastos) if (g.ano !== null) set.add(g.ano);
    for (const p of snap.previstos) if (p.ano !== null) set.add(p.ano);
    for (const m of snap.metas) set.add(m.ano);
    return [...set].sort((a, b) => b - a);
  }, [snap.gastos, snap.previstos, snap.metas]);

  // Padrao: ano mais recente com gasto realizado; senao o maior ano presente.
  // NUNCA o ano corrente do relogio — inventar um ano sem dados abre o painel
  // vazio (era o bug de "2026 sem dados" ao acessar de outra origem/maquina).
  const padrao = useMemo(() => {
    const comGasto = snap.gastos
      .map((g) => g.ano)
      .filter((a): a is number => a !== null)
      .sort((a, b) => b - a);
    return comGasto[0] ?? anos[0] ?? null;
  }, [snap.gastos, anos]);

  useEffect(() => {
    if (padrao !== null) reconcile(anos, padrao);
  }, [anos, padrao, reconcile]);

  // Enquanto os dados nao chegam, `ano` e null e a UI mostra estado de carga
  // em vez de um ano fabricado. Um ano salvo que nao existe nos dados tambem
  // e ignorado aqui (o reconcile corrige no efeito acima).
  const ano: Periodo | null =
    yearRaw === TODOS_ANOS || (yearRaw !== null && anos.includes(yearRaw)) ? yearRaw : padrao;

  const meta = useMemo(() => {
    if (ano === null) return null;
    if (ano === TODOS_ANOS) {
      // Acumulado: soma as metas anuais. Sem meta cadastrada em ano nenhum,
      // devolve null para o gauge mostrar "não cadastrado" em vez de R$ 0.
      if (snap.metas.length === 0) return null;
      return snap.metas.reduce((s, m) => s + m.valor, 0);
    }
    return snap.metas.find((m) => m.ano === ano)?.valor ?? null;
  }, [ano, snap.metas]);

  return {
    ...snap,
    loading: loadingState,
    refresh: loadShared,
    carregado: cache !== null,
    anos,
    ano,
    meta,
  };
}

const normTxt = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

function matchesSearch(haystack: string[], search: string): boolean {
  const q = normTxt(search);
  if (!q) return true;
  return normTxt(haystack.join(" ")).includes(q);
}

/**
 * Base dos GRAFICOS: ano + busca, mas SEM os filtros de dimensao.
 *
 * Os graficos precisam receber a base sem filtros de dimensao para que o
 * cross-filter funcione: cada um aplica `applyFilters(items, filters, dim)`
 * internamente e assim ignora a propria dimensao (uma barra clicada nao faz
 * o proprio grafico colapsar numa unica barra).
 */
export function useGastosBase(): Gasto[] {
  const { gastos, ano } = useBudget();
  const search = useGastoFilters((s) => s.search);
  return useMemo(
    () =>
      gastos
        .filter((g) => ano === TODOS_ANOS || g.ano === ano)
        .filter((g) =>
          matchesSearch(
            [
              g.nf,
              g.categoria,
              g.tipo,
              g.marca,
              g.modelo,
              g.fornecedor,
              g.descricao,
              g.departamento,
            ],
            search,
          ),
        ),
    [gastos, ano, search],
  );
}

/** Base dos graficos de previsto: ano + busca, sem filtros de dimensao. */
export function usePrevistosBase(): Previsto[] {
  const { previstos, ano } = useBudget();
  const search = usePrevistoFilters((s) => s.search);
  return useMemo(
    () =>
      previstos
        .filter((p) => ano === TODOS_ANOS || p.ano === ano)
        .filter((p) =>
          matchesSearch(
            [
              p.categoria,
              p.tipo,
              p.produto,
              p.marca,
              p.modelo,
              p.fornecedor,
              p.descricao,
              p.departamento,
            ],
            search,
          ),
        ),
    [previstos, ano, search],
  );
}

/** Conjunto TOTALMENTE filtrado — usado pelos KPIs e pela tabela. */
export function useGastosFiltrados(): Gasto[] {
  const base = useGastosBase();
  const filters = useGastoFilters((s) => s.filters);
  return useMemo(() => applyFilters(base, filters), [base, filters]);
}

/** Conjunto TOTALMENTE filtrado de previstos. */
export function usePrevistosFiltrados(): Previsto[] {
  const base = usePrevistosBase();
  const filters = usePrevistoFilters((s) => s.filters);
  return useMemo(() => applyFilters(base, filters), [base, filters]);
}

/**
 * Total realizado no ano anterior ao selecionado (base da "Diferença Anual").
 * No acumulado ("todos") nao existe "ano anterior" — devolve null, e a UI
 * mostra a comparacao como indisponivel em vez de um numero inventado.
 */
export function useGastoAnoAnterior(): number | null {
  const { gastos, ano } = useBudget();
  return useMemo(() => {
    if (ano === null || ano === TODOS_ANOS) return null;
    return totalValor(gastos.filter((g) => g.ano === ano - 1));
  }, [gastos, ano]);
}

/** Store de filtros da aba atual — usado pelo AppShell para busca e chips. */
export function filterStoreForPath(pathname: string): FilterStore {
  return pathname.startsWith("/previsto") ? usePrevistoFilters : useGastoFilters;
}
