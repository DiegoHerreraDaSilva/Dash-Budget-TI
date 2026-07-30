"use client";
import { useMemo, useState } from "react";
import { Award, Layers, Tags, Truck, Wallet } from "lucide-react";
import { BarList } from "@/components/charts/BarList";
import { DonutChart } from "@/components/charts/DonutChart";
import { DataTable } from "@/components/DataTable";
import { HighlightCard } from "@/components/HighlightCard";
import { TotalCard } from "@/components/TotalCard";
import { totalValor } from "@/lib/analytics";
import { useGastoFilters } from "@/lib/store";
import { useBudget, useGastosBase, useGastosFiltrados } from "@/lib/useBudget";
import { TODOS_ANOS } from "@/lib/types";

const DIAS_RECENTES = 90;

/** Aba "Geral": panorama do investimento realizado no ano selecionado. */
export default function GeralPage() {
  const { ano } = useBudget();
  // `base` alimenta os graficos (cross-filter); `gastos` e o conjunto
  // totalmente filtrado, usado nos totais e na tabela.
  const base = useGastosBase();
  const gastos = useGastosFiltrados();
  const [aba, setAba] = useState<"geral" | "recentes">("geral");

  const total = totalValor(gastos);
  const maiorCompra = useMemo(
    () =>
      gastos.reduce<(typeof gastos)[number] | null>(
        (max, g) => (max === null || g.valor > max.valor ? g : max),
        null,
      ),
    [gastos],
  );

  const recentes = useMemo(() => {
    const corte = Date.now() - DIAS_RECENTES * 86_400_000;
    return gastos.filter((g) => {
      const t = new Date(g.dataAquisicao).getTime();
      return Number.isFinite(t) && t >= corte;
    });
  }, [gastos]);

  const daTabela = aba === "recentes" ? recentes : gastos;

  // Guard DEPOIS de todos os hooks: retorno condicional antes deles muda a
  // contagem de hooks entre renders. O AppShell mostra o estado de carga.
  if (ano === null) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">
          Investimentos de TI — {ano === TODOS_ANOS ? "Todos os anos" : ano}
        </h1>
        <p className="text-sm muted">
          Clique em qualquer barra, fatia ou departamento para filtrar todo o painel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TotalCard
          title="Total Investido"
          total={total}
          icon={Wallet}
          items={base}
          store={useGastoFilters}
          registros={gastos.length}
        />
        <HighlightCard gasto={maiorCompra} store={useGastoFilters} />
        <BarList
          title="Categorias"
          subtitle="Total investido por categoria"
          icon={Layers}
          dim="categoria"
          items={base}
          store={useGastoFilters}
          colorMode="categoria"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BarList
          title="Sub-Categorias"
          subtitle="Total investido por sub-categoria"
          icon={Tags}
          dim="tipo"
          items={base}
          store={useGastoFilters}
          colorMode="mono"
          max={30}
          scrollHeight={400}
        />
        <DonutChart
          title="Principais Marcas"
          subtitle="Participação no valor investido"
          icon={Award}
          dim="marca"
          items={base}
          store={useGastoFilters}
          max={5}
        />
        <BarList
          title="Fornecedores"
          subtitle="Por número de compras"
          icon={Truck}
          dim="fornecedor"
          items={base}
          store={useGastoFilters}
          metric="contagem"
          colorMode="mono"
          max={100}
          scrollHeight={400}
        />
      </div>

      <DataTable
        items={daTabela}
        variant="realizado"
        title="Lançamentos"
        tabs={
          <div
            className="flex items-center gap-1 p-0.5 rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          >
            {(
              [
                ["geral", "Geral"],
                ["recentes", `Recentes (${DIAS_RECENTES}d)`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setAba(key)}
                className={`px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
                  aba === key ? "pill-accent" : "hover:bg-[var(--surface-2)]"
                }`}
                style={aba === key ? undefined : { color: "var(--text-muted)" }}
                aria-pressed={aba === key}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}
