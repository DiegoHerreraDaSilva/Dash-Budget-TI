import type { Gasto, Meta, Previsto } from "./types";

// Nomes internos das colunas no SharePoint. Acentos viram sequencias _x00XX_
// (ex.: "Descricao" -> Descri_x00e7__x00e3_o).
const SP = {
  // Investimentos de TI (realizado)
  nf: "NF",
  valorNf: "Valor",
  condicaoPgto: "Condi_x00e7__x00e3_odePagamento",
  dataAquisicao: "DatadeAquisi_x00e7__x00e3_o",
  setor: "Setor",
  // Budget de TI (previsto)
  valorMensurado: "ValorMensurado",
  dataPrevista: "DataPrevista",
  departamento: "Departamento",
  produto: "Produto",
  // comuns
  categoria: "Categoria",
  tipo: "Tipo_",
  marca: "Marca",
  modelo: "Modelo",
  quantidade: "Quantidade",
  descricao: "Descri_x00e7__x00e3_o",
  fornecedor: "Fornecedor",
  contato: "Contato",
  // Valor Budget
  ano: "Ano",
} as const;

export const NAO_INFORMADO = "Não informado";

export const MESES_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

type Raw = Record<string, unknown>;

function txt(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\s+/g, " ").trim();
}

function dim(v: unknown): string {
  return txt(v) || NAO_INFORMADO;
}

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  // aceita "1.234,56" e "1234.56"
  const s = String(v).trim().replace(/\s/g, "");
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * A coluna "Data de Aquisição" da lista de investimentos e texto no formato
 * dd/MM/yyyy. "Data Prevista" e datetime ISO. Esta funcao aceita os dois
 * (e tolera a coluna mudar de tipo no SharePoint no futuro).
 */
export function parseDataFlex(v: unknown): { iso: string; ano: number | null; mes: string } {
  const s = txt(v);
  if (!s) return { iso: "", ano: null, mes: NAO_INFORMADO };

  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (br) {
    const [, d, m, y] = br;
    const ano = Number(y);
    const mesIdx = Number(m) - 1;
    // meio-dia UTC evita o dia "voltar" por fuso ao formatar
    const iso = new Date(Date.UTC(ano, mesIdx, Number(d), 12)).toISOString();
    return { iso, ano, mes: MESES_PT[mesIdx] ?? NAO_INFORMADO };
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return { iso: "", ano: null, mes: NAO_INFORMADO };
  return {
    iso: d.toISOString(),
    ano: d.getUTCFullYear(),
    mes: MESES_PT[d.getUTCMonth()] ?? NAO_INFORMADO,
  };
}

export function normalizeGasto(raw: Raw): Gasto {
  const { iso, ano, mes } = parseDataFlex(raw[SP.dataAquisicao]);
  const valor = num(raw[SP.valorNf]);
  // fallback 1 evita divisao por zero no preco unitario
  const quantidade = Math.max(1, num(raw[SP.quantidade], 1));

  return {
    id: txt(raw.id),
    nf: txt(raw[SP.nf]) || "-",
    categoria: dim(raw[SP.categoria]),
    tipo: dim(raw[SP.tipo]),
    marca: dim(raw[SP.marca]),
    modelo: dim(raw[SP.modelo]),
    descricao: txt(raw[SP.descricao]),
    fornecedor: dim(raw[SP.fornecedor]),
    contato: txt(raw[SP.contato]),
    departamento: dim(raw[SP.setor]),
    condicaoPgto: txt(raw[SP.condicaoPgto]),
    quantidade,
    valor,
    precoUnitario: valor / quantidade,
    dataAquisicao: iso,
    ano,
    mes,
  };
}

export function normalizePrevisto(raw: Raw): Previsto {
  const { iso, ano, mes } = parseDataFlex(raw[SP.dataPrevista]);
  return {
    id: txt(raw.id),
    departamento: dim(raw[SP.departamento]),
    categoria: dim(raw[SP.categoria]),
    tipo: dim(raw[SP.tipo]),
    produto: dim(raw[SP.produto]),
    marca: dim(raw[SP.marca]),
    modelo: dim(raw[SP.modelo]),
    descricao: txt(raw[SP.descricao]),
    fornecedor: dim(raw[SP.fornecedor]),
    contato: txt(raw[SP.contato]),
    quantidade: Math.max(1, num(raw[SP.quantidade], 1)),
    valor: num(raw[SP.valorMensurado]),
    dataPrevista: iso,
    ano,
    mes,
  };
}

export function normalizeMeta(raw: Raw): Meta | null {
  const { ano } = parseDataFlex(raw[SP.ano]);
  if (ano === null) return null;
  return { ano, valor: num(raw[SP.valorNf]) };
}
