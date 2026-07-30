"use client";
import type { LucideIcon } from "lucide-react";
import { applyFilters, sumBy, type Aggregable } from "@/lib/analytics";
import type { Dimension } from "@/lib/types";
import type { FilterStore } from "@/lib/store";
import { formatCurrency, formatPct } from "@/lib/format";
import { Card } from "./Card";
import { colorFor, useIsDark, type ColorMode } from "./palette";

interface Props {
  title: string;
  icon?: LucideIcon;
  /** Prefixo da linha de total, ex.: "Total Investido" / "Total Previsto". */
  totalLabel: string;
  dim: Dimension;
  items: Aggregable[];
  store: FilterStore;
  colorMode?: ColorMode;
  height?: number;
}

/**
 * Painel "Categorias" / "Sub-Categorias": nome + % + barra de progresso +
 * total em R$, com rolagem e clique para filtrar.
 */
export function ProgressList({
  title,
  icon,
  totalLabel,
  dim,
  items,
  store,
  colorMode = "categoria",
  height = 260,
}: Props) {
  const filters = store((s) => s.filters);
  const toggle = store((s) => s.toggle);
  const dark = useIsDark();

  const scoped = applyFilters(items, filters, dim);
  const buckets = sumBy(scoped, dim);
  const selected = filters[dim] ?? [];
  const hasSel = selected.length > 0;

  return (
    <Card title={title} icon={icon}>
      {buckets.length === 0 ? (
        <p className="text-xs muted py-10 text-center">Sem dados no período.</p>
      ) : (
        <div className="flex flex-col gap-4 pr-1" style={{ maxHeight: height, overflowY: "auto" }}>
          {buckets.map((b, idx) => {
            const active = selected.includes(b.key);
            const cor = colorFor(colorMode, b.key, idx, dark);
            return (
              <button
                key={b.key}
                onClick={() => toggle(dim, b.key)}
                aria-pressed={active}
                className="text-left"
                style={{ opacity: hasSel && !active ? 0.4 : 1 }}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-base font-semibold truncate"
                    style={{
                      color: cor,
                      textShadow: active ? `0 0 14px ${cor}` : "none",
                    }}
                  >
                    {b.key}
                  </span>
                  <span
                    className="text-base font-semibold tabular-nums ml-auto shrink-0"
                    style={{ color: "var(--text)" }}
                  >
                    {formatPct(b.pct)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full w-full overflow-hidden mt-1.5 bar-track">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.max(2, b.pct)}%`,
                      background: `linear-gradient(90deg, ${cor} 0%, color-mix(in srgb, ${cor} 70%, white) 100%)`,
                      boxShadow: active
                        ? `0 0 12px 0 ${cor}, inset 0 0 0 1px rgba(255,255,255,.35)`
                        : `0 0 6px -2px ${cor}`,
                      outline: active ? "2px solid var(--text)" : "none",
                      outlineOffset: "-2px",
                    }}
                  />
                </div>
                <p className="text-xs muted mt-1.5 tabular-nums">
                  {totalLabel}: {formatCurrency(b.sum)}
                  <span className="ml-2 opacity-70">
                    ({b.count} {b.count === 1 ? "item" : "itens"})
                  </span>
                </p>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
