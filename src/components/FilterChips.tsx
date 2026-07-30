"use client";
import { useState } from "react";
import { X, Filter, Search, Plus } from "lucide-react";
import { sumBy, type Aggregable } from "@/lib/analytics";
import { DIM_LABELS, type FilterStore } from "@/lib/store";
import type { Dimension } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  items: Aggregable[];
  store: FilterStore;
  dims: Dimension[];
  searchPlaceholder: string;
}

/** Busca global + construtor de filtro + chips dos filtros ativos. */
export function FilterChips({ items, store, dims, searchPlaceholder }: Props) {
  const filters = store((s) => s.filters);
  const toggle = store((s) => s.toggle);
  const clearAll = store((s) => s.clearAll);
  const search = store((s) => s.search);
  const setSearch = store((s) => s.setSearch);

  const [open, setOpen] = useState(false);
  const [dim, setDim] = useState<Dimension>(dims[0]);

  const entries = Object.entries(filters) as [Dimension, string[]][];
  const count = entries.reduce((s, [, v]) => s + v.length, 0);
  const values = sumBy(items, dim);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div
        className="flex items-center gap-2 px-3 h-9 rounded-lg border"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <Search size={15} className="muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="bg-transparent outline-none text-sm w-64 max-w-[55vw]"
          style={{ color: "var(--text)" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Limpar busca"
            title="Limpar busca"
            className="muted hover:opacity-70 -mr-1"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium hover:bg-[var(--surface-2)]"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          <Plus size={15} /> Filtro
        </button>
        {open && (
          <div
            className="absolute z-40 mt-2 p-3 rounded-xl border shadow-lg w-80"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <label className="text-xs muted">Campo</label>
            <select
              value={dim}
              onChange={(e) => setDim(e.target.value as Dimension)}
              className="w-full mt-1 mb-3 px-2 h-9 rounded-lg border bg-transparent text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              {dims.map((d) => (
                <option key={d} value={d} style={{ color: "#000" }}>
                  {DIM_LABELS[d]}
                </option>
              ))}
            </select>

            <label className="text-xs muted">Valor</label>
            <div className="mt-1 max-h-60 overflow-y-auto flex flex-col gap-1">
              {values.map((v) => {
                const active = (filters[dim] ?? []).includes(v.key);
                return (
                  <button
                    key={v.key}
                    onClick={() => toggle(dim, v.key)}
                    className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm ${active ? "pill-accent" : "hover:bg-[var(--surface-2)]"}`}
                    style={active ? undefined : { color: "var(--text)" }}
                    data-ativo={active ? "" : undefined}
                  >
                    <span className="truncate">{v.key}</span>
                    <span className="tabular-nums text-xs opacity-80 shrink-0">
                      {formatCurrency(v.sum)}
                    </span>
                  </button>
                );
              })}
              {values.length === 0 && <span className="text-xs muted">Sem valores.</span>}
            </div>
          </div>
        )}
      </div>

      <span className="flex items-center gap-1.5 text-xs muted whitespace-nowrap">
        <Filter size={14} /> {count > 0 ? `${count} filtro(s)` : "Sem filtros"}
      </span>

      {entries.map(([d, vals]) =>
        vals.map((v) => (
          <button
            key={`${d}:${v}`}
            onClick={() => toggle(d, v)}
            className="pill-accent flex items-center gap-1.5 pl-2.5 pr-1.5 h-7 rounded-full text-xs font-medium max-w-[260px]"
            title={`${DIM_LABELS[d]}: ${v}`}
          >
            <span className="opacity-80 shrink-0">{DIM_LABELS[d] ?? d}:</span>
            <span className="truncate">{v}</span>
            <X size={13} className="shrink-0" />
          </button>
        )),
      )}

      {count > 0 && (
        <button onClick={clearAll} className="text-xs underline muted hover:opacity-80 ml-1">
          Limpar tudo
        </button>
      )}
    </div>
  );
}
