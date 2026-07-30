"use client";
import { Calendar, Sigma } from "lucide-react";
import { useYearStore } from "@/lib/year";
import { TODOS_ANOS, type Periodo } from "@/lib/types";

/**
 * Seletor de periodo global — recorta as tres abas de uma vez.
 *
 * Oferece cada ano presente nos dados mais "Todos os anos" (acumulado). Enquanto
 * a busca nao volta (`anos` vazio) fica desabilitado, em vez de oferecer um
 * periodo fabricado que abriria o painel vazio.
 */
export function YearSelect({ anos, ano }: { anos: number[]; ano: Periodo | null }) {
  const setYear = useYearStore((s) => s.setYear);
  const vazio = anos.length === 0;
  const acumulado = ano === TODOS_ANOS;

  return (
    <label
      className="flex items-center gap-2 px-2.5 h-9 rounded-lg border"
      style={{
        borderColor: acumulado ? "var(--accent)" : "var(--border)",
        background: acumulado
          ? "color-mix(in srgb, var(--accent) 12%, var(--surface))"
          : "var(--surface)",
        boxShadow: acumulado ? "0 0 12px -4px var(--accent-glow)" : "none",
        opacity: vazio ? 0.6 : 1,
      }}
      title={
        vazio
          ? "Carregando períodos disponíveis..."
          : acumulado
            ? "Somando todos os anos"
            : "Período de referência"
      }
    >
      {acumulado ? (
        <Sigma size={15} style={{ color: "var(--accent-hi)" }} aria-hidden />
      ) : (
        <Calendar size={15} className="muted" aria-hidden />
      )}
      <span className="text-xs muted hidden sm:inline">{acumulado ? "Período" : "Ano"}</span>
      <select
        value={ano ?? ""}
        disabled={vazio}
        onChange={(e) => {
          const v = e.target.value;
          setYear((v === TODOS_ANOS ? TODOS_ANOS : Number(v)) as Periodo);
        }}
        aria-label="Período de referência"
        className="bg-transparent outline-none text-sm font-semibold tabular-nums cursor-pointer disabled:cursor-wait"
        style={{ color: "var(--text)" }}
      >
        {vazio && <option value="">—</option>}
        {!vazio && (
          <option value={TODOS_ANOS} style={{ color: "#000" }}>
            Todos os anos
          </option>
        )}
        {anos.map((a) => (
          <option key={a} value={a} style={{ color: "#000" }}>
            {a}
          </option>
        ))}
      </select>
    </label>
  );
}
