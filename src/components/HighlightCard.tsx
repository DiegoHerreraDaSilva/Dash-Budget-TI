"use client";
import { TrendingUp } from "lucide-react";
import type { Gasto } from "@/lib/types";
import type { FilterStore } from "@/lib/store";
import { formatCurrencyShort, formatDate, formatInt } from "@/lib/format";
import { IconBox } from "./IconBox";

/** "Maior Compra": o item de maior valor do periodo, com atalhos de filtro. */
export function HighlightCard({ gasto, store }: { gasto: Gasto | null; store: FilterStore }) {
  const toggle = store((s) => s.toggle);

  return (
    <section className="card p-4">
      <header className="flex items-start gap-2">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          Maior Compra
        </h3>
        <div className="ml-auto">
          <IconBox icon={TrendingUp} />
        </div>
      </header>

      {gasto === null ? (
        <p className="text-xs muted py-10 text-center">Sem compras no período.</p>
      ) : (
        <>
          <p className="text-2xl font-semibold mt-2 tabular-nums num-hero">
            {formatCurrencyShort(gasto.valor)}
          </p>
          <dl className="mt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex items-baseline gap-3">
              <dt className="muted w-28 shrink-0">Categoria</dt>
              <dd className="min-w-0">
                <button
                  onClick={() => toggle("categoria", gasto.categoria)}
                  className="font-medium underline decoration-dotted underline-offset-2 truncate max-w-full text-left"
                  style={{ color: "var(--accent-hi)" }}
                >
                  {gasto.categoria}
                </button>
              </dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="muted w-28 shrink-0">Sub-Categoria</dt>
              <dd className="min-w-0">
                <button
                  onClick={() => toggle("tipo", gasto.tipo)}
                  className="font-medium underline decoration-dotted underline-offset-2 truncate max-w-full text-left"
                  style={{ color: "var(--accent-hi)" }}
                >
                  {gasto.tipo}
                </button>
              </dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="muted w-28 shrink-0">Fornecedor</dt>
              <dd className="min-w-0 truncate" style={{ color: "var(--text)" }}>
                {gasto.fornecedor}
              </dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="muted w-28 shrink-0">Quantidade</dt>
              <dd style={{ color: "var(--text)" }}>{formatInt(gasto.quantidade)}</dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="muted w-28 shrink-0">Data</dt>
              <dd style={{ color: "var(--text)" }}>{formatDate(gasto.dataAquisicao)}</dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="muted w-28 shrink-0">NF</dt>
              <dd className="tabular-nums" style={{ color: "var(--text)" }}>
                {gasto.nf}
              </dd>
            </div>
          </dl>
          {gasto.descricao && (
            <p className="text-xs muted mt-3 line-clamp-3" title={gasto.descricao}>
              {gasto.descricao}
            </p>
          )}
        </>
      )}
    </section>
  );
}
