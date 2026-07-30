"use client";
import type { LucideIcon } from "lucide-react";
import { applyFilters, countBy, foldTail, sumBy, type Aggregable, type Bucket } from "@/lib/analytics";
import type { Dimension } from "@/lib/types";
import type { FilterStore } from "@/lib/store";
import { formatCurrency, formatInt } from "@/lib/format";
import { Card } from "./Card";
import { colorFor, glow, useIsDark, type ColorMode } from "./palette";

interface Props {
  title: string;
  subtitle?: string;
  /** Ícone do cabeçalho, coerente com o título. */
  icon?: LucideIcon;
  dim: Dimension;
  items: Aggregable[];
  store: FilterStore;
  /** "valor" ordena e dimensiona por R$; "contagem" por numero de registros. */
  metric?: "valor" | "contagem";
  colorMode?: ColorMode;
  max?: number;
  /** Altura maxima da lista; acima disso rola. */
  scrollHeight?: number;
  /** Barras verticais (usado no "Top 3 Fornecedores"). */
  orientation?: "horizontal" | "vertical";
  /** Agrupa a cauda em "Outros" em vez de cortar (padrao em dimensoes livres). */
  fold?: boolean;
}

export function BarList({
  title,
  subtitle,
  icon,
  dim,
  items,
  store,
  metric = "valor",
  colorMode = "serie",
  max = 12,
  scrollHeight,
  orientation = "horizontal",
  fold = false,
}: Props) {
  const filters = store((s) => s.filters);
  const toggle = store((s) => s.toggle);
  const toggleMany = store((s) => s.toggleMany);
  const dark = useIsDark();

  const selected = filters[dim] ?? [];
  const hasSel = selected.length > 0;

  // Cross-filter: ignora o proprio eixo nos filtros de fundo.
  const scoped = applyFilters(items, filters, dim);
  const todos = metric === "valor" ? sumBy(scoped, dim) : countBy(scoped, dim);
  const buckets = fold ? foldTail(todos, max, selected) : todos.slice(0, max);

  const valueOf = (b: Bucket) => (metric === "valor" ? b.sum : b.count);
  const label = (b: Bucket) => (metric === "valor" ? formatCurrency(b.sum) : formatInt(b.count));
  const top = buckets.length > 0 ? Math.max(...buckets.map(valueOf)) : 1;

  const clique = (b: Bucket) => (b.keys ? toggleMany(dim, b.keys) : toggle(dim, b.key));
  const ativo = (b: Bucket) =>
    b.keys ? b.keys.some((k) => selected.includes(k)) : selected.includes(b.key);

  if (buckets.length === 0) {
    return (
      <Card title={title} subtitle={subtitle} icon={icon}>
        <p className="text-xs muted py-10 text-center">Sem dados no período.</p>
      </Card>
    );
  }

  if (orientation === "vertical") {
    return (
      <Card title={title} subtitle={subtitle} icon={icon}>
        <div className="flex items-end justify-around gap-3 h-[220px] pt-6">
          {buckets.map((b, idx) => {
            const active = ativo(b);
            const cor = colorFor(colorMode, b.key, idx, dark);
            const h = Math.max(6, (valueOf(b) / (top || 1)) * 100);
            return (
              <button
                key={b.key}
                onClick={() => clique(b)}
                aria-pressed={active}
                className="flex flex-col items-center justify-end h-full flex-1 min-w-0 group"
                style={{ opacity: hasSel && !active ? 0.35 : 1 }}
                title={`${b.key}: ${label(b)}`}
              >
                <span
                  className="text-xs font-semibold mb-1 tabular-nums"
                  style={{ color: "var(--text)" }}
                >
                  {label(b)}
                </span>
                <div
                  className="w-full max-w-[64px] transition-all duration-200"
                  style={{
                    height: `${h}%`,
                    borderRadius: "4px 4px 0 0",
                    background: `linear-gradient(180deg, color-mix(in srgb, ${cor} 82%, white) 0%, ${cor} 100%)`,
                    filter: active ? glow(cor, 10) : glow(cor, 3),
                    outline: active ? "2px solid var(--text)" : "none",
                    outlineOffset: "-2px",
                  }}
                />
                <span className="text-xs muted mt-1.5 truncate w-full text-center">{b.key}</span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} subtitle={subtitle} icon={icon}>
      <div
        className="flex flex-col gap-2.5"
        style={
          scrollHeight
            ? {
                maxHeight: scrollHeight,
                overflowY: "auto",
                paddingRight: 4,
                // Folga no fim: sem isso a última barra encosta na borda de corte
                // e desaparece, deixando só o rótulo visível.
                paddingBottom: 8,
              }
            : undefined
        }
      >
        {buckets.map((b, idx) => {
          const active = ativo(b);
          const cor = colorFor(colorMode, b.key, idx, dark);
          return (
            <button
              key={b.key}
              onClick={() => clique(b)}
              aria-pressed={active}
              className="text-left group"
              style={{ opacity: hasSel && !active ? 0.35 : 1 }}
              title={b.keys ? `${b.keys.length} itens agrupados: ${b.keys.join(", ")}` : undefined}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="truncate pr-2" style={{ color: "var(--text)" }}>
                  {b.key}
                </span>
                <span className="tabular-nums muted shrink-0">{label(b)}</span>
              </div>
              <div className="h-2.5 rounded-full w-full overflow-hidden bar-track">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.max(4, (valueOf(b) / (top || 1)) * 100)}%`,
                    background: `linear-gradient(90deg, ${cor} 0%, color-mix(in srgb, ${cor} 72%, white) 100%)`,
                    boxShadow: active
                      ? `0 0 12px 0 ${cor}, inset 0 0 0 1px rgba(255,255,255,.35)`
                      : `0 0 6px -2px ${cor}`,
                    outline: active ? "2px solid var(--text)" : "none",
                    outlineOffset: "-2px",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
