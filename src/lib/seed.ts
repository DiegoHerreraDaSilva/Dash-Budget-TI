// ============================================================================
// DADOS FICTÍCIOS — nenhuma informação real da Schwaben Engineering aqui.
//
// Este arquivo é o fallback usado quando USE_SEED_DATA=true (rodar sem
// credenciais do Graph) ou quando a leitura do SharePoint falha. Serve para o
// painel nunca abrir vazio e para demonstração pública do projeto.
//
// Fornecedores, notas fiscais, valores e descrições são inventados. O snapshot
// real das listas fica em src/lib/seed.real.ts, que NÃO é versionado — ele
// contém NFs, preços de fornecedor e nomes de pessoas.
//
// Para usar o snapshot real localmente, troque o import em
// src/app/api/budget/route.ts para "@/lib/seed.real".
// ============================================================================
import type { Gasto, Meta, Previsto } from "./types";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Helper para manter as linhas curtas e o preço unitário sempre coerente. */
function gasto(
  id: string,
  nf: string,
  categoria: string,
  tipo: string,
  marca: string,
  modelo: string,
  departamento: string,
  quantidade: number,
  valor: number,
  data: string, // "yyyy-mm-dd"
  fornecedor: string,
  descricao = "",
): Gasto {
  const [y, m] = data.split("-");
  return {
    id,
    nf,
    categoria,
    tipo,
    marca,
    modelo,
    descricao,
    fornecedor,
    contato: "",
    departamento,
    condicaoPgto: "A combinar",
    quantidade,
    valor,
    precoUnitario: valor / quantidade,
    dataAquisicao: `${data}T12:00:00.000Z`,
    ano: Number(y),
    mes: MESES[Number(m) - 1],
  };
}

function previsto(
  id: string,
  departamento: string,
  categoria: string,
  tipo: string,
  produto: string,
  marca: string,
  modelo: string,
  quantidade: number,
  valor: number,
  data: string,
  fornecedor: string,
  descricao = "",
): Previsto {
  const [y, m] = data.split("-");
  return {
    id,
    departamento,
    categoria,
    tipo,
    produto,
    marca,
    modelo,
    descricao,
    fornecedor,
    contato: "",
    quantidade,
    valor,
    dataPrevista: `${data}T12:00:00.000Z`,
    ano: Number(y),
    mes: MESES[Number(m) - 1],
  };
}

export const SEED_GASTOS: Gasto[] = [
  gasto("1", "000000101", "Hardware", "Notebook", "Marca A", "Modelo A1", "ADM", 6, 42000, "2024-02-15", "Fornecedor Alfa", "Notebooks para equipe administrativa"),
  gasto("2", "000000102", "Licenciamento", "Software", "Marca B", "Suite CAD", "CAD", 10, 88000, "2024-03-20", "Fornecedor Beta", "Renovação anual de licenças de engenharia"),
  gasto("3", "000000103", "Infraestrutura", "Ar Condicionado", "Marca C", "Split 12k", "T.I", 2, 9600, "2024-05-08", "Fornecedor Gama", "Climatização do CPD"),
  gasto("4", "000000104", "Licenciamento", "Firewall", "Marca D", "FW-100", "T.I", 1, 4200, "2024-06-11", "Fornecedor Delta", "Renovação de subscrição"),
  gasto("5", "000000105", "Periféricos", "Monitor", "Marca A", "Monitor 24", "ADM", 8, 7200, "2024-08-02", "Fornecedor Alfa"),
  gasto("6", "000000106", "Serviço", "Manutenção", "Não informado", "Não informado", "T.I", 1, 2800, "2024-10-17", "Fornecedor Épsilon", "Manutenção preventiva de nobreaks"),
  gasto("7", "000000107", "Hardware", "Workstation", "Marca E", "WS-Pro", "CAD", 3, 63000, "2025-01-22", "Fornecedor Zeta", "Estações de trabalho para projetos"),
  gasto("8", "000000108", "Licenciamento", "Antivírus", "Marca F", "Endpoint", "T.I", 60, 9000, "2025-03-05", "Fornecedor Eta", "Renovação de endpoint protection"),
  gasto("9", "000000109", "Infraestrutura", "Switch", "Marca D", "SW-24P", "T.I", 2, 7400, "2025-04-14", "Fornecedor Delta", "Switches de acesso"),
  gasto("10", "000000110", "Periféricos", "Headset", "Marca G", "HS-Basic", "ADM", 12, 2400, "2025-06-09", "Fornecedor Teta"),
  gasto("11", "000000111", "Hardware", "Storage", "Marca E", "NAS-8TB", "T.I", 1, 15800, "2025-07-28", "Fornecedor Zeta", "Storage para backup"),
];

export const SEED_PREVISTOS: Previsto[] = [
  previsto("1", "CAD", "Licenciamento", "Renovação", "Software Engenharia", "Marca B", "Suite CAD", 12, 96000, "2025-08-31", "Fornecedor Beta", "Renovação anual prevista"),
  previsto("2", "T.I", "Licenciamento", "Renovação", "Antivírus", "Marca F", "Endpoint", 60, 9500, "2025-09-15", "Fornecedor Eta", "Renovação de endpoint protection"),
  previsto("3", "T.I", "Infraestrutura", "Aquisição e Instalação", "Ar Condicionado", "Marca C", "Split 24k", 1, 8800, "2025-05-20", "Fornecedor Gama", "Climatização de sala nova"),
  previsto("4", "ADM", "Hardware", "Aquisição", "Mouse", "Marca A", "MS-Std", 10, 1500, "2025-02-28", "Fornecedor Alfa"),
  previsto("5", "T.I", "Infraestrutura", "Manutenção Preventiva", "Nobreak", "Não informado", "Não informado", 4, 3200, "2025-11-10", "Fornecedor Épsilon", "Manutenção anual"),
];

export const SEED_METAS: Meta[] = [
  { ano: 2024, valor: 180000 },
  { ano: 2025, valor: 120000 },
];
