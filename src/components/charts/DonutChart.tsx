"use client";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { applyFilters, foldTail, sumBy, type Aggregable, type Bucket } from "@/lib/analytics";
import type { Dimension } from "@/lib/types";
import type { FilterStore } from "@/lib/store";
import { formatCurrency, formatCurrencyShort, formatPct } from "@/lib/format";
import { Card } from "./Card";
import { arc } from "./arc";
import { colorFor, useIsDark, type ColorMode } from "./palette";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  dim: Dimension;
  items: Aggregable[];
  store: FilterStore;
  colorMode?: ColorMode;
  /** Slots de cor da rampa; o excedente vira "Outros" (nunca cicla a rampa). */
  max?: number;
}

export function DonutChart({
  title,
  subtitle,
  icon,
  dim,
  items,
  store,
  colorMode = "serie",
  max = 5,
}: Props) {
  const filters = store((s) => s.filters);
  const toggle = store((s) => s.toggle);
  const toggleMany = store((s) => s.toggleMany);
  const dark = useIsDark();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const selected = filters[dim] ?? [];
  const hasSel = selected.length > 0;

  // Cross-filter: a propria dimensao nao se auto-filtra.
  const scoped = applyFilters(items, filters, dim);
  const todos = sumBy(scoped, dim);
  const buckets = foldTail(todos, max, selected);
  const total = buckets.reduce((s, b) => s + b.sum, 0);

  const size = 210;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const sw = 24;
  let angle = -Math.PI / 2;

  const clique = (b: Bucket) => (b.keys ? toggleMany(dim, b.keys) : toggle(dim, b.key));
  const ativo = (b: Bucket) =>
    b.keys ? b.keys.some((k) => selected.includes(k)) : selected.includes(b.key);

  const selectedSum = hasSel
    ? buckets.filter(ativo).reduce((s, b) => s + b.sum, 0)
    : total;
  const hovered = hoverKey ? buckets.find((b) => b.key === hoverKey) : null;

  return (
    <Card title={title} subtitle={subtitle} icon={icon}>
      {buckets.length === 0 ? (
        <p className="text-xs muted py-10 text-center">Sem dados no período.</p>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            <defs>
              {buckets.map((b, idx) => {
                const cor = colorFor(colorMode, b.key, idx, dark);
                return (
                  <linearGradient
                    key={b.key}
                    id={`don-${dim}-${idx}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={cor} stopOpacity="0.75" />
                    <stop offset="100%" stopColor={cor} />
                  </linearGradient>
                );
              })}
            </defs>

            {/* trilha de fundo */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={sw} />

            {buckets.map((b, idx) => {
              const frac = total > 0 ? b.sum / total : 0;
              const start = angle;
              // 2px de respiro entre fatias (spacer da superficie)
              const gap = buckets.length > 1 ? 0.02 : 0;
              const end = angle + frac * Math.PI * 2;
              angle = end;
              if (frac <= 0) return null;
              const active = ativo(b);
              const isHover = hoverKey === b.key;
              const dimmed = (hasSel && !active) || (!!hoverKey && !isHover);
              const cor = colorFor(colorMode, b.key, idx, dark);
              return (
                <path
                  key={b.key}
                  d={arc(
                    cx,
                    cy,
                    r,
                    start + gap / 2,
                    Math.max(start + gap / 2, Math.min(end - gap / 2, start + Math.PI * 2 - 0.0001)),
                  )}
                  fill="none"
                  stroke={`url(#don-${dim}-${idx})`}
                  strokeWidth={active || isHover ? sw + 7 : sw}
                  strokeLinecap="butt"
                  style={{
                    cursor: "pointer",
                    opacity: dimmed ? 0.3 : 1,
                    filter: active || isHover ? `drop-shadow(0 0 9px ${cor})` : "none",
                    transition: "all .18s ease",
                  }}
                  onMouseEnter={() => setHoverKey(b.key)}
                  onMouseLeave={() => setHoverKey(null)}
                  onClick={() => clique(b)}
                >
                  <title>{`${b.key}: ${formatCurrency(b.sum)} (${formatPct(b.pct)})`}</title>
                </path>
              );
            })}

            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              fontSize="17"
              fontWeight="700"
              fill="var(--text)"
            >
              {hovered
                ? formatPct(hovered.pct)
                : hasSel
                  ? formatPct(total > 0 ? (selectedSum / total) * 100 : 0)
                  : formatCurrencyShort(total)}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="12" fill="var(--text-muted)">
              {hovered ? hovered.key.slice(0, 18) : hasSel ? "selecionado" : "no período"}
            </text>
          </svg>

          <div className="w-full mt-4">
            <div
              className="text-sm font-medium h-5 truncate text-center tabular-nums"
              style={{ color: hovered ? "var(--text)" : "var(--text-muted)" }}
            >
              {hovered ? formatCurrency(hovered.sum) : "Passe o mouse na fatia"}
            </div>
            {/* Legenda sempre presente: identidade nunca depende so da cor. */}
            <ul className="flex flex-col gap-1.5 text-sm mt-2">
              {buckets.map((b, idx) => {
                const active = ativo(b);
                const cor = colorFor(colorMode, b.key, idx, dark);
                return (
                  <li key={b.key}>
                    <button
                      onClick={() => clique(b)}
                      onMouseEnter={() => setHoverKey(b.key)}
                      onMouseLeave={() => setHoverKey(null)}
                      className="flex items-center gap-2 w-full text-left"
                      style={{ opacity: hasSel && !active ? 0.35 : 1 }}
                      aria-pressed={active}
                      title={b.keys ? `${b.keys.length} itens: ${b.keys.join(", ")}` : undefined}
                    >
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{
                          background: cor,
                          boxShadow: active ? `0 0 8px 0 ${cor}` : "none",
                          outline: active ? "2px solid var(--text)" : "none",
                          outlineOffset: 1,
                        }}
                      />
                      <span className="truncate" style={{ color: "var(--text)" }}>
                        {b.key}
                        {b.keys && <span className="muted"> ({b.keys.length})</span>}
                      </span>
                      <span className="ml-auto tabular-nums muted text-xs">{formatPct(b.pct)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
