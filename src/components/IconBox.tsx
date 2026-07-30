import type { LucideIcon } from "lucide-react";

/**
 * Ícone de cabeçalho de card: caixa de 36px com fundo e anel translúcidos na
 * cor do tom. Nunca use o ícone solto — esta é a forma canônica no design
 * system (ver skill `schwaben-ui`).
 */
export function IconBox({
  icon: Icon,
  color = "var(--accent-hi)",
  size = 18,
}: {
  icon: LucideIcon;
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      <Icon size={size} style={{ color }} aria-hidden />
    </span>
  );
}
