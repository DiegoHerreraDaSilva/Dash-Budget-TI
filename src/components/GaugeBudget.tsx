"use client";
import { Target } from "lucide-react";
import { formatCurrency, formatCurrencyShort, formatPct } from "@/lib/format";
import { arc } from "./charts/arc";
import { toneVars, type CardTone } from "./charts/Card";
import { IconBox } from "./IconBox";
import { TODOS_ANOS, type Periodo } from "@/lib/types";

interface Props {
  /** Teto de budget do ano (null quando nao cadastrado em "Valor Budget"). */
  meta: number | null;
  /** Total realizado no ano. */
  gasto: number;
  ano: Periodo;
}

function toneFor(pct: number | null): CardTone {
  if (pct === null) return "neutral";
  if (pct >= 100) return "bad";
  if (pct >= 85) return "warn";
  return "ok";
}

/** Gauge radial "% do budget consumido" — o medidor da aba Budget T.I. */
export function GaugeBudget({ meta, gasto, ano }: Props) {
  const pct = meta && meta > 0 ? (gasto / meta) * 100 : null;
  const clamped = Math.min(100, Math.max(0, pct ?? 0));
  const tone = toneFor(pct);
  const cor = tone === "neutral" ? "var(--text-muted)" : `var(--${tone})`;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const start = -Math.PI / 2;
  const end = start + (clamped / 100) * Math.PI * 2;

  return (
    <section className="card p-4 flex flex-col" style={toneVars(tone)}>
      <header className="flex items-start gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Budget T.I
          </h3>
          <p className="text-xs muted tabular-nums">
            {ano === TODOS_ANOS ? "Todos os anos" : ano}
          </p>
        </div>
        <div className="ml-auto">
          <IconBox icon={Target} color={cor} />
        </div>
      </header>

      <p className="text-2xl font-semibold mt-1 num-hero">
        {meta === null ? "Não cadastrado" : formatCurrencyShort(meta)}
      </p>
      <p className="text-xs muted">
        {ano === TODOS_ANOS ? "Soma das metas anuais" : "Teto do ano"} · lista Valor Budget
      </p>

      <div className="grid place-items-center mt-2 grow">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={cor} />
            </linearGradient>
          </defs>

          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="15" />

          {clamped > 0 && (
            <path
              d={arc(cx, cy, r, start, Math.min(end, start + Math.PI * 2 - 0.0001))}
              fill="none"
              stroke="url(#gauge-grad)"
              strokeWidth="15"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 10px ${cor})`, transition: "all .3s ease" }}
            />
          )}

          <text
            x={cx}
            y={cy - 1}
            textAnchor="middle"
            fontSize="31"
            fontWeight="700"
            fill={cor}
            style={{ filter: `drop-shadow(0 0 12px color-mix(in srgb, ${cor} 45%, transparent))` }}
          >
            {pct === null ? "—" : formatPct(pct)}
          </text>
          <text
            x={cx}
            y={cy + 23}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-muted)"
            letterSpacing="2"
          >
            CONSUMIDO
          </text>
        </svg>
      </div>

      {/* Estado sempre com rotulo, nunca so pela cor. */}
      <p className="text-xs mt-1 tabular-nums" style={{ color: cor }}>
        {pct === null
          ? "Budget não cadastrado"
          : pct >= 100
            ? `Estourado em ${formatCurrency(gasto - (meta ?? 0))}`
            : `${formatCurrency(gasto)} de ${formatCurrency(meta ?? 0)}`}
      </p>
    </section>
  );
}
