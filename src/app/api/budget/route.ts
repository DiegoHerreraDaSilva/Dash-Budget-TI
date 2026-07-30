import { NextResponse } from "next/server";
import { SEED_GASTOS, SEED_METAS, SEED_PREVISTOS } from "@/lib/seed";
import { fetchGastos, fetchMetas, fetchPrevistos, listAvailableLists } from "@/lib/sharepoint";
import type { BudgetPayload } from "@/lib/types";

export const dynamic = "force-dynamic"; // sempre dados frescos
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

const seedPayload = (error: string | null): BudgetPayload => ({
  gastos: SEED_GASTOS,
  previstos: SEED_PREVISTOS,
  metas: SEED_METAS,
  source: "seed",
  error,
});

export async function GET(request: Request) {
  const useSeed = (process.env.USE_SEED_DATA ?? "true").toLowerCase() === "true";
  const debug = new URL(request.url).searchParams.get("debug");

  // Diagnostico: /api/budget?debug=lists -> mostra as listas do site
  if (debug === "lists") {
    try {
      const lists = await listAvailableLists();
      return NextResponse.json(
        {
          ok: true,
          dica: "Use um destes valores (displayName ou interno) nas variaveis SHAREPOINT_LIST_*.",
          listas: lists.map((l) => ({ displayName: l.displayName, interno: l.name, id: l.id })),
        },
        { headers: NO_CACHE },
      );
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500, headers: NO_CACHE });
    }
  }

  if (useSeed) {
    return NextResponse.json(seedPayload(null), { headers: NO_CACHE });
  }

  try {
    // As tres listas sao independentes: le em paralelo.
    const [gastos, previstos, metas] = await Promise.all([
      fetchGastos(),
      fetchPrevistos(),
      fetchMetas(),
    ]);
    const payload: BudgetPayload = { gastos, previstos, metas, source: "live", error: null };
    return NextResponse.json(payload, { headers: NO_CACHE });
  } catch (e) {
    // Fallback seguro: nao derruba o dashboard se o Graph falhar.
    return NextResponse.json(
      seedPayload(
        `Falha ao ler o SharePoint, exibindo snapshot local. Detalhe: ${String(e)}`,
      ),
      { headers: NO_CACHE },
    );
  }
}
