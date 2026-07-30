"use client";
import type { LucideIcon } from "lucide-react";
import type { Dimension } from "@/lib/types";
import type { FilterStore } from "@/lib/store";
import { toneVars, type CardTone } from "./charts/Card";
import { IconBox } from "./IconBox";

const TONE_VAR: Record<CardTone, string> = {
  brand: "var(--accent-hi)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
  neutral: "var(--text-muted)",
};

interface BaseProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: CardTone;
}

function Conteudo({ label, value, hint, icon: Icon, tone = "brand" }: BaseProps) {
  const cor = TONE_VAR[tone];
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0">
        <p
          className="text-xl font-semibold truncate tabular-nums"
          style={{ color: cor, textShadow: `0 0 18px color-mix(in srgb, ${cor} 35%, transparent)` }}
        >
          {value}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>
          {label}
        </p>
        {hint && <p className="text-xs muted mt-0.5">{hint}</p>}
      </div>
      <div className="ml-auto">
        <IconBox icon={Icon} color={cor} />
      </div>
    </div>
  );
}

/** Card de metrica (numero derivado que nao mapeia num filtro). */
export function StatCard(props: BaseProps & { onClick?: () => void }) {
  const { onClick, ...rest } = props;
  const style = toneVars(rest.tone ?? "brand");
  if (!onClick) {
    return (
      <div className="card p-4" style={style}>
        <Conteudo {...rest} />
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={rest.label} className="card p-4 text-left w-full" style={style}>
      <Conteudo {...rest} />
    </button>
  );
}

/**
 * Card de metrica que aplica um cross-filter ao ser clicado — regra do design
 * system: KPI clicavel, com estado ativo refletido do store.
 */
export function StatCardFilter({
  dim,
  filterValue,
  store,
  ...rest
}: BaseProps & { dim: Dimension; filterValue: string; store: FilterStore }) {
  const active = store((s) => (s.filters[dim] ?? []).includes(filterValue));
  const toggle = store((s) => s.toggle);
  const cor = TONE_VAR[rest.tone ?? "brand"];

  return (
    <button
      type="button"
      onClick={() => toggle(dim, filterValue)}
      aria-pressed={active}
      aria-label={`Filtrar por ${rest.label}`}
      className="card p-4 text-left w-full"
      style={{
        ...toneVars(rest.tone ?? "brand"),
        outline: active ? `2px solid ${cor}` : "none",
        outlineOffset: "-2px",
      }}
    >
      <Conteudo {...rest} />
    </button>
  );
}
