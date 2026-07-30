"use client";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { applyFilters, serieAnual, serieMensal, type Aggregable } from "@/lib/analytics";
import type { FilterStore } from "@/lib/store";
import { formatCurrency, formatCurrencyAxis } from "@/lib/format";
import { useYearStore } from "@/lib/year";
import { Card } from "./Card";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  items: Aggregable[];
  store: FilterStore;
  /** Sufixo unico do id dos gradientes SVG (dois graficos na mesma pagina). */
  idKey?: string;
  /**
   * "mes" = 12 slots fixos jan..dez (um ano selecionado).
   * "ano" = um ponto por ano (periodo acumulado). Somar os "janeiros" de anos
   * diferentes numa serie temporal nao diz nada — no acumulado o eixo vira ano.
   */
  mode?: "mes" | "ano";
}

/**
 * Evolucao no tempo em R$. SVG puro, sem lib de grafico.
 *
 * No modo "mes" cada ponto filtra pelo mes (dimensao "mes"). No modo "ano" o
 * clique faz drill-down: seleciona aquele ano no seletor global.
 */
export function LineChart({
  title,
  subtitle,
  icon,
  items,
  store,
  idKey = "l",
  mode = "mes",
}: Props) {
  const filters = store((s) => s.filters);
  const toggle = store((s) => s.toggle);
  const setYear = useYearStore((s) => s.setYear);
  const [hover, setHover] = useState<number | null>(null);

  const porAno = mode === "ano";
  const selectedMes = filters.mes ?? [];

  // Cross-filter: no modo mes ignora o filtro de mes ao montar a serie.
  const scoped = applyFilters(items, filters, porAno ? undefined : "mes");

  // `slots` sao as posicoes do eixo; `pontos` sao as que de fato tem valor.
  const slots: { label: string; sum: number }[] = porAno
    ? serieAnual(scoped).map((p) => ({ label: String(p.ano), sum: p.sum }))
    : serieMensal(scoped).map((p) => ({ label: p.mes, sum: p.sum }));

  const ativo = (label: string) => (porAno ? false : selectedMes.includes(label));
  const clique = (label: string) =>
    porAno ? setYear(Number(label)) : toggle("mes", label);

  // Slot sem valor fica fora da linha — nao inventa zero no meio da serie.
  const pontos = slots
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.sum > 0 || ativo(p.label));

  const W = 640;
  const H = 240;
  const padL = 14;
  const padR = 14;
  const padT = 38;
  const padB = 28;
  const maxV = Math.max(...slots.map((p) => p.sum), 1);
  const divisor = Math.max(1, slots.length - 1);

  const x = (i: number) => padL + (i / divisor) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB);

  const linha = pontos.map((p, k) => `${k === 0 ? "M" : "L"} ${x(p.i)} ${y(p.sum)}`).join(" ");
  const area =
    pontos.length > 1
      ? `${linha} L ${x(pontos[pontos.length - 1].i)} ${H - padB} L ${x(pontos[0].i)} ${H - padB} Z`
      : "";
  const temDados = pontos.length > 0;
  const larguraAlvo = (W - padL - padR) / divisor;

  return (
    <Card title={title} subtitle={subtitle} icon={icon}>
      {!temDados ? (
        <p className="text-xs muted py-16 text-center">Sem lançamentos no período.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id={`ln-${idKey}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-hi)" />
            </linearGradient>
            <linearGradient id={`ar-${idKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-hi)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--accent-hi)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            x1={padL}
            y1={H - padB}
            x2={W - padR}
            y2={H - padB}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {area && <path d={area} fill={`url(#ar-${idKey})`} />}
          {pontos.length > 1 && (
            <path
              d={linha}
              fill="none"
              stroke={`url(#ln-${idKey})`}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 7px var(--accent-glow))" }}
            />
          )}

          {slots.map((p, i) => {
            const isPonto = pontos.some((q) => q.i === i);
            const active = ativo(p.label);
            const isHover = hover === i;
            return (
              <g
                key={p.label}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => clique(p.label)}
                style={{ cursor: "pointer" }}
              >
                {/* area de clique generosa (maior que a marca) */}
                <rect
                  x={x(i) - Math.min(22, larguraAlvo / 2)}
                  y={padT - 26}
                  width={Math.min(44, larguraAlvo)}
                  height={H - padT - padB + 50}
                  fill="transparent"
                />
                {(isHover || active) && isPonto && (
                  <line
                    x1={x(i)}
                    y1={padT - 18}
                    x2={x(i)}
                    y2={H - padB}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
                {isPonto && (
                  <>
                    <text
                      x={x(i)}
                      y={y(p.sum) - 13}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={active || isHover ? "700" : "500"}
                      fill={active || isHover ? "var(--text)" : "var(--text-muted)"}
                    >
                      {formatCurrencyAxis(p.sum)}
                    </text>
                    <circle
                      cx={x(i)}
                      cy={y(p.sum)}
                      r={active || isHover ? 6 : 4.5}
                      fill="var(--accent-hi)"
                      stroke="var(--surface)"
                      strokeWidth="2"
                      style={{
                        filter:
                          active || isHover
                            ? "drop-shadow(0 0 8px var(--accent-hi))"
                            : "drop-shadow(0 0 4px var(--accent-glow))",
                      }}
                    />
                  </>
                )}
                <text
                  x={x(i)}
                  y={H - padB + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={active ? "700" : "400"}
                  fill={active ? "var(--accent-hi)" : "var(--text-muted)"}
                >
                  {p.label}
                </text>
                <title>{`${p.label}: ${formatCurrency(p.sum)}${porAno ? " — clique para ver só este ano" : ""}`}</title>
              </g>
            );
          })}
        </svg>
      )}
    </Card>
  );
}
