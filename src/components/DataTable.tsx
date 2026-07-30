"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Columns3, ChevronDown } from "lucide-react";
import type { Aggregable } from "@/lib/analytics";
import type { Gasto, Previsto } from "@/lib/types";
import { formatCurrency, formatDate, formatInt } from "@/lib/format";
import { colorFor, useIsDark } from "./charts/palette";

type ColType = "text" | "categoria" | "currency" | "dateiso" | "int";

interface Col {
  key: string;
  label: string;
  type?: ColType;
}

// Mesma ordem/rotulos das telas do relatorio.
export const COLS_REALIZADO: Col[] = [
  { key: "nf", label: "NF" },
  { key: "categoria", label: "Categoria", type: "categoria" },
  { key: "tipo", label: "Tipo" },
  { key: "marca", label: "Marca" },
  { key: "modelo", label: "Modelo" },
  { key: "precoUnitario", label: "Preço Unitário", type: "currency" },
  { key: "quantidade", label: "Quantidade", type: "int" },
  { key: "valor", label: "Valor", type: "currency" },
  { key: "dataAquisicao", label: "Data de Aquisição", type: "dateiso" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "departamento", label: "Departamento" },
  { key: "condicaoPgto", label: "Condição de Pgto" },
  { key: "contato", label: "Contato" },
  { key: "descricao", label: "Descrição" },
];

export const COLS_PREVISTO: Col[] = [
  { key: "categoria", label: "Categoria", type: "categoria" },
  // A coluna no SharePoint chama "Tipo_"; o underscore final parece um
  // sublinhado na tela, então o cabeçalho mostra "Tipo".
  { key: "tipo", label: "Tipo" },
  { key: "produto", label: "Produto" },
  { key: "modelo", label: "Modelo" },
  { key: "marca", label: "Marca" },
  { key: "quantidade", label: "Quantidade", type: "int" },
  { key: "valor", label: "Valor Mensurado", type: "currency" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "dataPrevista", label: "Data Prevista", type: "dateiso" },
  { key: "descricao", label: "Descrição" },
  { key: "departamento", label: "Departamento" },
  { key: "contato", label: "Contato" },
];

/** Colunas escondidas por padrao (as telas do relatorio mostram menos campos). */
const DEFAULT_HIDDEN: Record<"realizado" | "previsto", string[]> = {
  realizado: ["departamento", "condicaoPgto", "contato", "descricao"],
  previsto: ["departamento", "contato"],
};

function raw(item: Aggregable, key: string): unknown {
  return (item as unknown as Record<string, unknown>)[key];
}

function cellValue(item: Aggregable, col: Col): string {
  const v = raw(item, col.key);
  if (col.type === "currency") return formatCurrency(typeof v === "number" ? v : null);
  if (col.type === "int") return formatInt(typeof v === "number" ? v : null);
  if (col.type === "dateiso") return formatDate(String(v ?? ""));
  return v === null || v === undefined || v === "" ? "-" : String(v);
}

interface Props {
  items: (Gasto | Previsto)[];
  variant: "realizado" | "previsto";
  title?: string;
  /** Aba extra "Recentes" (so faz sentido no realizado, que tem data de compra). */
  tabs?: React.ReactNode;
}

export function DataTable({ items, variant, title, tabs }: Props) {
  const columns = variant === "realizado" ? COLS_REALIZADO : COLS_PREVISTO;
  const [sortKey, setSortKey] = useState<string>("valor");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [hidden, setHidden] = useState<Set<string>>(new Set(DEFAULT_HIDDEN[variant]));
  const [colsOpen, setColsOpen] = useState(false);
  const [count, setCount] = useState(40);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dark = useIsDark();

  const visibleCols = columns.filter((c) => !hidden.has(c.key));

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    const numeric = col?.type === "currency" || col?.type === "int";
    return [...items].sort((a, b) => {
      if (numeric) {
        const av = Number(raw(a, sortKey) ?? 0);
        const bv = Number(raw(b, sortKey) ?? 0);
        return (av - bv) * dir;
      }
      if (col?.type === "dateiso") {
        return String(raw(a, sortKey) ?? "").localeCompare(String(raw(b, sortKey) ?? "")) * dir;
      }
      return (
        String(raw(a, sortKey) ?? "").localeCompare(String(raw(b, sortKey) ?? ""), "pt-BR") * dir
      );
    });
  }, [items, sortKey, dir, columns]);

  const onSort = (key: string) => {
    if (key === sortKey) setDir((d) => (d * -1) as 1 | -1);
    else {
      setSortKey(key);
      setDir(-1);
    }
  };

  const toggleCol = (key: string) =>
    setHidden((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  // Carregamento progressivo: reseta ao mudar dados/ordenacao.
  useEffect(() => {
    setCount(40);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [items, sortKey, dir]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
      setCount((c) => (c < sorted.length ? c + 40 : c));
    }
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-3 flex-wrap border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="text-sm font-semibold">
          {title ?? "Lançamentos"} ({items.length})
        </h3>
        {tabs}
        <div className="relative ml-auto">
          <button
            onClick={() => setColsOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border text-xs font-medium hover:bg-[var(--surface-2)]"
            style={{ borderColor: "var(--border)" }}
          >
            <Columns3 size={14} /> Colunas ({visibleCols.length}/{columns.length}){" "}
            <ChevronDown size={13} />
          </button>
          {colsOpen && (
            <div
              className="absolute right-0 z-40 mt-2 p-2 rounded-xl border shadow-lg w-64 max-h-80 overflow-y-auto"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div
                className="flex justify-between px-1 pb-2 mb-1 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <button className="text-xs text-[var(--brand)]" onClick={() => setHidden(new Set())}>
                  Mostrar todas
                </button>
                <button
                  className="text-xs muted"
                  onClick={() => setHidden(new Set(DEFAULT_HIDDEN[variant]))}
                >
                  Padrão
                </button>
              </div>
              {columns.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 px-1.5 py-1 text-sm cursor-pointer rounded hover:bg-[var(--surface-2)]"
                >
                  <input
                    type="checkbox"
                    checked={!hidden.has(c.key)}
                    onChange={() => toggleCol(c.key)}
                  />
                  <span className="truncate">{c.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="overflow-auto" style={{ maxHeight: "70vh" }}>
        <table className="text-sm w-full" style={{ minWidth: "max-content" }}>
          <thead>
            <tr className="text-left" style={{ color: "var(--text-muted)" }}>
              {visibleCols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => onSort(c.key)}
                  className="px-4 py-2 font-medium cursor-pointer whitespace-nowrap hover:underline sticky top-0 z-10"
                  style={{ background: "var(--surface)" }}
                >
                  {c.label} {sortKey === c.key ? (dir === 1 ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, count).map((it) => (
              <tr key={it.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                {visibleCols.map((c) => (
                  <td key={c.key} className="px-4 py-2 whitespace-nowrap">
                    {c.type === "categoria" ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
                        style={{
                          background: colorFor("categoria", it.categoria, 0, dark),
                          boxShadow: `0 0 10px -3px ${colorFor("categoria", it.categoria, 0, dark)}`,
                        }}
                      >
                        {it.categoria}
                      </span>
                    ) : (
                      <span
                        className={c.key === "descricao" ? "muted" : undefined}
                        title={c.key === "descricao" ? String(raw(it, "descricao") ?? "") : undefined}
                      >
                        {c.key === "descricao"
                          ? cellValue(it, c).slice(0, 80) +
                            (cellValue(it, c).length > 80 ? "…" : "")
                          : cellValue(it, c)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length} className="px-4 py-10 text-center text-sm muted">
                  Nenhum lançamento com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {count < sorted.length && (
          <div className="px-4 py-2 text-center text-xs muted">
            Carregando mais... ({count} de {sorted.length})
          </div>
        )}
      </div>
    </div>
  );
}
