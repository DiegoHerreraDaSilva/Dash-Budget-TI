// Modelos normalizados a partir das tres listas do SharePoint.
//
//  "Investimentos de TI" -> Gasto     (realizado; abas Geral e Budget T.I)
//  "Budget de TI"        -> Previsto  (aba Budget Previsto)
//  "Valor Budget"        -> Meta      (teto de budget por ano)

/** Gasto realizado (uma linha = uma nota fiscal / item comprado). */
export interface Gasto {
  id: string;
  nf: string;
  categoria: string; // Hardware / Infraestrutura / Licenciamento / Perifericos / Servico
  tipo: string; // Tipo_ -> sub-categoria (Notebook, Workstation, Firewall, ...)
  marca: string;
  modelo: string;
  descricao: string;
  fornecedor: string;
  contato: string;
  departamento: string; // coluna "Setor" na lista
  condicaoPgto: string;
  quantidade: number;
  valor: number; // "Valor NF" - total da linha
  precoUnitario: number; // derivado: valor / quantidade
  dataAquisicao: string; // ISO (a coluna original e texto dd/MM/yyyy)
  ano: number | null;
  mes: string; // "jan" ... "dez" ("Nao informado" se sem data)
}

/** Item de budget previsto. */
export interface Previsto {
  id: string;
  departamento: string; // coluna "Departamento"
  categoria: string;
  tipo: string; // Tipo_ -> sub-categoria (Renovacao, Aquisicao, ...)
  produto: string;
  marca: string;
  modelo: string;
  descricao: string;
  fornecedor: string;
  contato: string;
  quantidade: number;
  valor: number; // "Valor Mensurado"
  dataPrevista: string; // ISO
  ano: number | null;
  mes: string;
}

/** Teto de budget de um ano. */
export interface Meta {
  ano: number;
  valor: number;
}

/** Dimensoes disponiveis para cross-filter (validas para Gasto e Previsto). */
export type Dimension =
  | "categoria"
  | "tipo"
  | "marca"
  | "modelo"
  | "departamento"
  | "fornecedor"
  | "produto"
  | "mes";

export type Filters = Partial<Record<Dimension, string[]>>;

/**
 * Recorte de período do painel: um ano específico ou o acumulado de todos.
 * `"todos"` soma as três listas inteiras — inclusive as metas anuais.
 */
export const TODOS_ANOS = "todos" as const;
export type Periodo = number | typeof TODOS_ANOS;

/** Payload de /api/budget */
export interface BudgetPayload {
  gastos: Gasto[];
  previstos: Previsto[];
  metas: Meta[];
  source: "live" | "seed";
  error: string | null;
}
