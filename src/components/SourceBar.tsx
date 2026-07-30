"use client";
import { RefreshCw, Database, Cloud } from "lucide-react";

export function SourceBar({
  source,
  loading,
  onRefresh,
}: {
  source: "live" | "seed" | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const live = source === "live";
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center gap-1.5 text-xs px-2.5 h-7 rounded-full border whitespace-nowrap"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        title={
          live
            ? "Dados ao vivo do SharePoint"
            : "Snapshot local (configure o Graph para dados ao vivo)"
        }
      >
        {live ? <Cloud size={13} /> : <Database size={13} />}
        {live ? "SharePoint ao vivo" : "Snapshot"}
      </span>
      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 text-xs px-2.5 h-7 rounded-full border hover:bg-[var(--surface-2)] whitespace-nowrap"
        style={{ borderColor: "var(--border)" }}
      >
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
      </button>
    </div>
  );
}
