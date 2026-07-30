"use client";
import {
  Building2,
  CalendarClock,
  Layers,
  LineChart as LineChartIcon,
  PiggyBank,
  Tags,
  Wallet,
} from "lucide-react";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { ProgressList } from "@/components/charts/ProgressList";
import { DataTable } from "@/components/DataTable";
import { GaugeBudget } from "@/components/GaugeBudget";
import { StatCard } from "@/components/StatCard";
import { computeKpisRealizado, totalValor } from "@/lib/analytics";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { useGastoFilters } from "@/lib/store";
import { useBudget, useGastosBase, useGastosFiltrados } from "@/lib/useBudget";
import { TODOS_ANOS } from "@/lib/types";

/** Aba "Budget T.I": realizado contra o teto do ano. */
export default function BudgetPage() {
  const { ano, meta, previstos } = useBudget();
  // `base` alimenta os graficos (cross-filter); `gastos` e o conjunto filtrado.
  const base = useGastosBase();
  const gastos = useGastosFiltrados();

  if (ano === null) return null; // o AppShell mostra o estado de carga

  // O orcamento futuro e o total previsto do ano, sem os filtros do realizado
  // (sao listas diferentes; misturar os filtros daria um numero sem sentido).
  const orcamentoFuturo = totalValor(
    previstos.filter((p) => ano === TODOS_ANOS || p.ano === ano),
  );
  const kpis = computeKpisRealizado(gastos, meta, orcamentoFuturo);

  const restanteTone = kpis.restante === null ? "neutral" : kpis.restante < 0 ? "bad" : "ok";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">
          Budget T.I — {ano === TODOS_ANOS ? "Todos os anos" : ano}
        </h1>
        <p className="text-sm muted">
          Teto do ano vindo da lista <strong>Valor Budget</strong>; consumo vindo de{" "}
          <strong>Investimentos de TI</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GaugeBudget meta={meta} gasto={kpis.totalGasto} ano={ano} />

        <div className="flex flex-col gap-4">
          <StatCard
            label="Valor Gasto"
            value={formatCurrencyShort(kpis.totalGasto)}
            hint={formatCurrency(kpis.totalGasto)}
            icon={Wallet}
            tone="brand"
          />
          <StatCard
            label="Valor Restante"
            value={kpis.restante === null ? "—" : formatCurrencyShort(kpis.restante)}
            hint={
              kpis.restante === null
                ? "Budget do ano não cadastrado"
                : kpis.restante < 0
                  ? "Acima do teto do ano"
                  : formatCurrency(kpis.restante)
            }
            icon={PiggyBank}
            tone={restanteTone}
          />
          <StatCard
            label="Orçamento Futuro"
            value={formatCurrencyShort(orcamentoFuturo)}
            hint={`Total previsto — ${ano === TODOS_ANOS ? "todos os anos" : ano}`}
            icon={CalendarClock}
            tone="neutral"
          />
        </div>

        <ProgressList
          title="Categorias"
          icon={Layers}
          totalLabel="Total Investido"
          dim="categoria"
          items={base}
          store={useGastoFilters}
          colorMode="categoria"
          height={300}
        />
        <ProgressList
          title="Sub-Categorias"
          icon={Tags}
          totalLabel="Total Investido"
          dim="tipo"
          items={base}
          store={useGastoFilters}
          colorMode="mono"
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarList
          title="Valor Gasto por Departamento"
          icon={Building2}
          dim="departamento"
          items={base}
          store={useGastoFilters}
          colorMode="departamento"
        />
        <LineChart
          title={ano === TODOS_ANOS ? "Evolução de Gastos por Ano" : "Evolução de Gastos por Mês"}
          subtitle={
            ano === TODOS_ANOS
              ? "Clique em um ano para ver só ele"
              : "Clique em um mês para filtrar"
          }
          icon={LineChartIcon}
          items={base}
          store={useGastoFilters}
          idKey="gasto"
          mode={ano === TODOS_ANOS ? "ano" : "mes"}
        />
      </div>

      <DataTable items={gastos} variant="realizado" title="Lançamentos" />
    </div>
  );
}
