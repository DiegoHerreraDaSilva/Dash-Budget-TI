"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gauge, CalendarClock, AlertTriangle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "./Logo";
import { FilterChips } from "./FilterChips";
import { SourceBar } from "./SourceBar";
import { ThemeToggle } from "./ThemeToggle";
import { YearSelect } from "./YearSelect";
import { useBudget } from "@/lib/useBudget";
import { useGastoFilters, usePrevistoFilters } from "@/lib/store";
import { TODOS_ANOS, type Dimension } from "@/lib/types";

const TABS = [
  { href: "/", label: "Geral", icon: LayoutDashboard },
  { href: "/budget", label: "Budget T.I", icon: Gauge },
  { href: "/previsto", label: "Budget Previsto", icon: CalendarClock },
];

const DIMS_REALIZADO: Dimension[] = [
  "categoria",
  "tipo",
  "marca",
  "modelo",
  "departamento",
  "fornecedor",
  "mes",
];

const DIMS_PREVISTO: Dimension[] = [
  "categoria",
  "tipo",
  "produto",
  "marca",
  "modelo",
  "departamento",
  "fornecedor",
  "mes",
];

/**
 * Estado enquanto a primeira busca nao voltou, ou quando as tres listas estao
 * vazias. Antes o painel inventava o ano corrente do relogio e abria vazio,
 * como se nao houvesse dados — isto deixa a diferenca explicita.
 */
function Placeholder({ carregado, loading }: { carregado: boolean; loading: boolean }) {
  if (!carregado || loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex items-center gap-2 text-sm muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Carregando dados do SharePoint...
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-4 h-48 animate-pulse" />
          ))}
        </div>
        <div className="card p-4 h-64 animate-pulse" />
      </div>
    );
  }
  return (
    <div className="card p-8 text-center">
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        Nenhum lançamento encontrado nas listas do SharePoint.
      </p>
      <p className="text-sm muted mt-1">
        Verifique as listas Investimentos de TI, Budget de TI e Valor Budget, e o acesso do
        App Registration ao site.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { gastos, previstos, loading, source, error, refresh, anos, ano, carregado } = useBudget();

  const isPrevisto = pathname.startsWith("/previsto");
  // A aba de previsto tem seu proprio namespace de filtros (dimensoes e valores
  // diferentes); Geral e Budget T.I compartilham o namespace do realizado.
  const store = isPrevisto ? usePrevistoFilters : useGastoFilters;
  const itemsDoAno = isPrevisto
    ? previstos.filter((p) => ano === TODOS_ANOS || p.ano === ano)
    : gastos.filter((g) => ano === TODOS_ANOS || g.ano === ano);

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur border-b"
        style={{
          background: "color-mix(in srgb, var(--surface) 88%, transparent)",
          borderColor: "var(--border)",
          boxShadow: "0 12px 28px -26px rgba(0,0,0,.9), 0 1px 0 0 var(--accent-glow)",
        }}
      >
        <div className="max-w-[1500px] mx-auto px-5 h-16 flex items-center gap-5">
          <div className="shrink-0">
            <Logo />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
              Budget de TI
            </p>
            <p className="text-xs muted leading-tight">Investimentos e previsão</p>
          </div>
          <nav className="flex items-center gap-1 ml-2 overflow-x-auto">
            {TABS.map((t) => {
              const active = pathname === t.href;
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  // Cor do item ativo via classes (e nao var() em style inline),
                  // para o tom trocar junto com o tema claro/escuro.
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    active
                      ? "pill-accent"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={16} aria-hidden />
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2.5 shrink-0">
            <YearSelect anos={anos} ano={ano} />
            <ThemeToggle />
          </div>
        </div>

        {/* Busca + filtros ativos (cross-filter da aba corrente) */}
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-[1500px] mx-auto px-5 py-2.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <FilterChips
                items={itemsDoAno}
                store={store}
                dims={isPrevisto ? DIMS_PREVISTO : DIMS_REALIZADO}
                searchPlaceholder={
                  isPrevisto
                    ? "Buscar (produto, marca, fornecedor...)"
                    : "Pesquisar NF, marca, modelo, fornecedor..."
                }
              />
            </div>
            <div className="shrink-0">
              <SourceBar source={source} loading={loading} onRefresh={refresh} />
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="max-w-[1500px] mx-auto px-5 pt-4"
          role="status"
        >
          <p
            className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg"
            style={{ background: "color-mix(in srgb, var(--warn) 15%, transparent)", color: "var(--text)" }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--warn)" }} aria-hidden />
            {error}
          </p>
        </div>
      )}

      <main className="max-w-[1500px] mx-auto px-5 py-6">
        {ano === null ? <Placeholder carregado={carregado} loading={loading} /> : children}
      </main>
    </div>
  );
}
