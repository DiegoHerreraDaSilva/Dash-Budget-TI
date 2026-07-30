import { MESES_PT, NAO_INFORMADO } from "./fieldMap";
import type { Dimension, Filters, Gasto, Previsto } from "./types";

/** Registro que pode ser agregado por qualquer Dimension. */
export type Aggregable = Gasto | Previsto;

export interface Bucket {
  key: string;
  sum: number; // total em R$
  count: number; // numero de registros
  pct: number; // 0..100, sobre a soma total dos buckets
  /** Presente somente no bucket "Outros": as chaves que ele agrupa. */
  keys?: string[];
}

function dimValue(item: Aggregable, dim: Dimension): string {
  const raw = (item as unknown as Record<string, unknown>)[dim];
  if (raw === undefined || raw === null) return NAO_INFORMADO;
  const s = String(raw).trim();
  return s || NAO_INFORMADO;
}

/**
 * Agrega por dimensao somando o valor em R$ (nao contagem — este dashboard
 * e financeiro). Ordena desc por soma; empate resolve por contagem.
 */
export function sumBy(items: Aggregable[], dim: Dimension): Bucket[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const it of items) {
    const key = dimValue(it, dim);
    const cur = map.get(key) ?? { sum: 0, count: 0 };
    cur.sum += it.valor;
    cur.count += 1;
    map.set(key, cur);
  }
  const total = [...map.values()].reduce((s, b) => s + b.sum, 0);
  return [...map.entries()]
    .map(([key, b]) => ({
      key,
      sum: b.sum,
      count: b.count,
      pct: total > 0 ? (b.sum / total) * 100 : 0,
    }))
    .sort((a, b) => b.sum - a.sum || b.count - a.count);
}

/** Igual a sumBy, mas ordenado por contagem (usado em "Top N Fornecedores"). */
export function countBy(items: Aggregable[], dim: Dimension): Bucket[] {
  return sumBy(items, dim).sort((a, b) => b.count - a.count || b.sum - a.sum);
}

/**
 * Mantem os `max` maiores e soma a cauda num bucket "Outros", em vez de
 * simplesmente descartar o resto: a rampa categorica tem 5 slots e nao deve
 * ser ciclada, e o total continua fechando 100%.
 *
 * Buckets selecionados pelo filtro nunca caem na cauda — senao o usuario
 * clicaria numa fatia e ela desapareceria.
 */
export function foldTail(buckets: Bucket[], max: number, keep: string[] = []): Bucket[] {
  if (buckets.length <= max) return buckets;
  const head: Bucket[] = [];
  const tail: Bucket[] = [];
  for (const b of buckets) {
    if (head.length < max || keep.includes(b.key)) head.push(b);
    else tail.push(b);
  }
  if (tail.length === 0) return head;
  head.push({
    key: OUTROS,
    sum: tail.reduce((s, b) => s + b.sum, 0),
    count: tail.reduce((s, b) => s + b.count, 0),
    pct: tail.reduce((s, b) => s + b.pct, 0),
    /** Chaves agrupadas — usado no tooltip e no clique (filtra todas de uma vez). */
    keys: tail.map((b) => b.key),
  });
  return head;
}

export const OUTROS = "Outros";

/**
 * Aplica os filtros ativos, opcionalmente ignorando uma dimensao
 * (cross-filter estilo Power BI: o proprio grafico nao se auto-filtra).
 */
export function applyFilters<T extends Aggregable>(
  items: T[],
  filters: Filters,
  except?: Dimension,
): T[] {
  const entries = Object.entries(filters) as [Dimension, string[]][];
  if (entries.length === 0) return items;
  return items.filter((it) =>
    entries.every(([dim, values]) => {
      if (dim === except) return true;
      if (!values || values.length === 0) return true;
      return values.includes(dimValue(it, dim));
    }),
  );
}

export function totalValor(items: Aggregable[]): number {
  return items.reduce((s, i) => s + i.valor, 0);
}

/** Serie de 12 meses (jan..dez) somando R$ — base do grafico de evolucao. */
export function serieMensal(items: Aggregable[]): { mes: string; sum: number }[] {
  const map = new Map<string, number>(MESES_PT.map((m) => [m, 0]));
  for (const it of items) {
    if (!map.has(it.mes)) continue; // ignora "Nao informado"
    map.set(it.mes, (map.get(it.mes) ?? 0) + it.valor);
  }
  return MESES_PT.map((mes) => ({ mes, sum: map.get(mes) ?? 0 }));
}

/** Serie por ano, somando R$ — usada quando o periodo e o acumulado. */
export function serieAnual(items: Aggregable[]): { ano: number; sum: number }[] {
  const map = new Map<number, number>();
  for (const it of items) {
    if (it.ano === null) continue;
    map.set(it.ano, (map.get(it.ano) ?? 0) + it.valor);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([ano, sum]) => ({ ano, sum }));
}

export interface KpisRealizado {
  totalGasto: number;
  meta: number | null;
  restante: number | null;
  pctBudget: number | null;
  orcamentoFuturo: number;
  maiorCompra: Gasto | null;
  registros: number;
}

export function computeKpisRealizado(
  gastos: Gasto[],
  meta: number | null,
  orcamentoFuturo: number,
): KpisRealizado {
  const totalGasto = totalValor(gastos);
  const maiorCompra = gastos.reduce<Gasto | null>(
    (max, g) => (max === null || g.valor > max.valor ? g : max),
    null,
  );
  return {
    totalGasto,
    meta,
    restante: meta === null ? null : meta - totalGasto,
    pctBudget: meta && meta > 0 ? (totalGasto / meta) * 100 : null,
    orcamentoFuturo,
    maiorCompra,
    registros: gastos.length,
  };
}

export interface KpisPrevisto {
  totalPrevisto: number;
  /** null no acumulado, onde nao existe "ano anterior". */
  gastoAnoAnterior: number | null;
  /** Variacao % vs ano anterior. null se o ano anterior e zero ou inexistente. */
  diferencaAnual: number | null;
  registros: number;
}

export function computeKpisPrevisto(
  previstos: Previsto[],
  gastoAnoAnterior: number | null,
): KpisPrevisto {
  const totalPrevisto = totalValor(previstos);
  return {
    totalPrevisto,
    gastoAnoAnterior,
    // O relatorio antigo mostrava "inf" quando o ano anterior era zero
    // (divisao por zero). Aqui devolvemos null e a UI renderiza "—".
    diferencaAnual:
      gastoAnoAnterior !== null && gastoAnoAnterior > 0
        ? ((totalPrevisto - gastoAnoAnterior) / gastoAnoAnterior) * 100
        : null,
    registros: previstos.length,
  };
}
