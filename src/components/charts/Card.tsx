import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { IconBox } from "../IconBox";

export type CardTone = "brand" | "ok" | "warn" | "bad" | "neutral";

/** Cor do ícone/acento de cada tom. */
export const TONE_COLOR: Record<CardTone, string> = {
  brand: "var(--accent-hi)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
  neutral: "var(--text-muted)",
};

/**
 * Variaveis que o `.card` consome para pintar o contorno luminoso da base.
 * Passar no `style` do card permite um tom semantico por card sem CSS extra.
 */
export function toneVars(tone: CardTone = "brand"): CSSProperties {
  if (tone === "brand") return {};
  if (tone === "neutral") {
    return {
      "--card-accent": "var(--text-muted)",
      "--card-accent-hi": "var(--text-muted)",
      "--card-glow": "transparent",
    } as CSSProperties;
  }
  const v = `var(--${tone})`;
  return {
    "--card-accent": v,
    "--card-accent-hi": v,
    "--card-glow": `color-mix(in srgb, ${v} 40%, transparent)`,
  } as CSSProperties;
}

export function Card({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
  tone = "brand",
}: {
  title?: string;
  subtitle?: string;
  /** Ícone do cabeçalho, em caixa. Escolha um que descreva o título. */
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tone?: CardTone;
}) {
  return (
    <section className={`card p-4 ${className}`} style={toneVars(tone)}>
      {title && (
        <header className="mb-3 flex items-start gap-2">
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              {title}
            </h3>
            {subtitle && <p className="text-xs muted mt-0.5">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {action}
            {icon && <IconBox icon={icon} color={TONE_COLOR[tone]} />}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
