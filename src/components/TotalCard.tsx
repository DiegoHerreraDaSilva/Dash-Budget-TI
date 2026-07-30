"use client";
import type { LucideIcon } from "lucide-react";
import { applyFilters, sumBy, type Aggregable } from "@/lib/analytics";
import type { FilterStore } from "@/lib/store";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { colorFor, useIsDark } from "./charts/palette";
import { IconBox } from "./IconBox";

interface Props {
  title: string;
  /** Total do periodo, ja com todos os filtros aplicados. */
  total: number;
  icon: LucideIcon;
  /** Itens sem o filtro de departamento aplicado, para as barras internas. */
  items: Aggregable[];
  store: FilterStore;
  registros: number;
}

/**
 * "Total Investido" / "Budget Previsto": valor grande + quebra por departamento
 * em barras clicaveis (T.I / CAD / ADM).
 */
export function TotalCard({ title, total, icon: Icon, items, store, registros }: Props) {
  const filters = store((s) => s.filters);
  const toggle = store((s) => s.toggle);
  const dark = useIsDark();

  const scoped = applyFilters(items, filters, "departamento");
  const buckets = sumBy(scoped, "departamento");
  const top = buckets[0]?.sum ?? 1;
  const selected = filters.departamento ?? [];
  const hasSel = selected.length > 0;

  return (
    <section className="card p-4 flex flex-col">
      <header className="flex items-start gap-2">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          {title}
        </h3>
        <div className="ml-auto">
          <IconBox icon={Icon} />
        </div>
      </header>

      <p className="text-3xl font-semibold mt-2 tabular-nums num-hero">
        {formatCurrencyShort(total)}
      </p>
      <p className="text-xs muted tabular-nums">
        {formatCurrency(total)} · {registros} {registros === 1 ? "lançamento" : "lançamentos"}
      </p>

      <div className="flex flex-col gap-2.5 mt-4">
        {buckets.map((b, idx) => {
          const active = selected.includes(b.key);
          const cor = colorFor("departamento", b.key, idx, dark);
          return (
            <button
              key={b.key}
              onClick={() => toggle("departamento", b.key)}
              aria-pressed={active}
              className="flex items-center gap-2.5 text-left"
              style={{ opacity: hasSel && !active ? 0.35 : 1 }}
            >
              <span className="text-xs font-medium w-10 shrink-0" style={{ color: "var(--text)" }}>
                {b.key}
              </span>
              <span className="h-5 rounded-md flex-1 overflow-hidden bar-track">
                <span
                  className="h-full rounded-md flex items-center justify-end pr-1.5 transition-all duration-200"
                  style={{
                    width: `${Math.max(22, (b.sum / (top || 1)) * 100)}%`,
                    background: `linear-gradient(90deg, ${cor} 0%, color-mix(in srgb, ${cor} 72%, white) 100%)`,
                    boxShadow: active
                      ? `0 0 14px 0 ${cor}, inset 0 0 0 1px rgba(255,255,255,.35)`
                      : `0 0 7px -2px ${cor}`,
                    outline: active ? "2px solid var(--text)" : "none",
                    outlineOffset: "-2px",
                    display: "flex",
                  }}
                >
                  <span className="text-[10px] font-semibold tabular-nums text-white/95 whitespace-nowrap drop-shadow">
                    {formatCurrency(b.sum)}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
        {buckets.length === 0 && <p className="text-xs muted py-2">Sem dados no período.</p>}
      </div>
    </section>
  );
}
