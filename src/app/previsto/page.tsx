"use client";
import {
  Building2,
  CalendarClock,
  History,
  Layers,
  LineChart as LineChartIcon,
  Package,
  Percent,
  Tags,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { ProgressList } from "@/components/charts/ProgressList";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { TotalCard } from "@/components/TotalCard";
import { computeKpisPrevisto } from "@/lib/analytics";
import { formatCurrency, formatPct } from "@/lib/format";
import { usePrevistoFilters } from "@/lib/store";
import {
  useBudget,
  useGastoAnoAnterior,
  usePrevistosBase,
  usePrevistosFiltrados,
} from "@/lib/useBudget";
import { TODOS_ANOS } from "@/lib/types";

/** Aba "Budget Previsto": o que está planejado para o ano selecionado. */
export default function PrevistoPage() {
  const { ano } = useBudget();
  // `base` alimenta os graficos (cross-filter); `previstos` e o filtrado.
  const base = usePrevistosBase();
  const previstos = usePrevistosFiltrados();
  const gastoAnoAnterior = useGastoAnoAnterior();
  const kpis = computeKpisPrevisto(previstos, gastoAnoAnterior);

  if (ano === null) return null; // o AppShell mostra o estado de carga

  const dif = kpis.diferencaAnual;
  const difTone = dif === null ? "neutral" : dif > 0 ? "bad" : "ok";
  const DifIcon = dif === null ? Percent : dif > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">
          Budget Previsto — {ano === TODOS_ANOS ? "Todos os anos" : ano}
        </h1>
        <p className="text-sm muted">
          Planejamento da lista <strong>Budget de TI</strong>
          {ano === TODOS_ANOS ? "." : <>, comparado ao realizado de {ano - 1}.</>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <TotalCard
            title="Budget Previsto"
            total={kpis.totalPrevisto}
            icon={CalendarClock}
            items={base}
            store={usePrevistoFilters}
            registros={previstos.length}
          />
          <StatCard
            label={
              ano === TODOS_ANOS ? "Ano anterior" : `Valor Gasto em ${ano - 1}`
            }
            value={gastoAnoAnterior === null ? "—" : formatCurrency(gastoAnoAnterior)}
            hint={
              gastoAnoAnterior === null
                ? "Não se aplica ao acumulado de todos os anos"
                : "Realizado no ano anterior (Investimentos de TI)"
            }
            icon={History}
            tone="neutral"
          />
          <StatCard
            label="Diferença Anual"
            value={dif === null ? "—" : `${dif > 0 ? "+" : ""}${formatPct(dif)}`}
            hint={
              dif === null
                ? ano === TODOS_ANOS
                  ? "Não se aplica ao acumulado de todos os anos"
                  : `Sem gasto registrado em ${ano - 1} — comparação indisponível`
                : dif > 0
                  ? "Previsto acima do realizado do ano anterior"
                  : "Previsto abaixo do realizado do ano anterior"
            }
            icon={DifIcon}
            tone={difTone}
          />
        </div>

        <ProgressList
          title="Categorias"
          icon={Layers}
          totalLabel="Total Previsto"
          dim="categoria"
          items={base}
          store={usePrevistoFilters}
          colorMode="categoria"
          height={400}
        />
        <ProgressList
          title="Sub-Categorias"
          icon={Tags}
          totalLabel="Total Previsto"
          dim="tipo"
          items={base}
          store={usePrevistoFilters}
          colorMode="mono"
          height={400}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BarList
          title="Total Previsto por Departamento"
          icon={Building2}
          dim="departamento"
          items={base}
          store={usePrevistoFilters}
          colorMode="departamento"
        />
        <BarList
          title="Produtos"
          subtitle="Itens previstos por produto"
          icon={Package}
          dim="produto"
          items={base}
          store={usePrevistoFilters}
          colorMode="mono"
          max={20}
          scrollHeight={260}
        />
        <LineChart
          title={ano === TODOS_ANOS ? "Evolução Prevista por Ano" : "Evolução Prevista por Mês"}
          subtitle={
            ano === TODOS_ANOS
              ? "Clique em um ano para ver só ele"
              : "Clique em um mês para filtrar"
          }
          icon={LineChartIcon}
          items={base}
          store={usePrevistoFilters}
          idKey="previsto"
          mode={ano === TODOS_ANOS ? "ano" : "mes"}
        />
      </div>

      <DataTable items={previstos} variant="previsto" title="Itens previstos" />
    </div>
  );
}
