import { normalizeGasto, normalizeMeta, normalizePrevisto } from "./fieldMap";
import type { Gasto, Meta, Previsto } from "./types";

// Leitura das listas de budget via Microsoft Graph (client credentials).
// Setup das variaveis de ambiente no README.md / .env.example.

interface TokenCache {
  token: string;
  expiresAt: number;
}
let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const tenant = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error(
      "Credenciais do Azure AD ausentes (AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET).",
    );
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Falha ao obter token: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function graphGet(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Graph GET falhou (${res.status}): ${await res.text()}`);
  return res.json();
}

let siteIdCache: string | null = null;

async function resolveSiteId(token: string): Promise<string> {
  if (siteIdCache) return siteIdCache;
  const hostname = process.env.SHAREPOINT_HOSTNAME;
  const sitePath = process.env.SHAREPOINT_SITE_PATH;
  if (!hostname || !sitePath) {
    throw new Error("SHAREPOINT_HOSTNAME / SHAREPOINT_SITE_PATH ausentes.");
  }
  const site = await graphGet(
    `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`,
    token,
  );
  siteIdCache = site.id as string;
  return siteIdCache;
}

interface ListInfo {
  id: string;
  name: string;
  displayName: string;
  webUrl: string;
}

async function getAllLists(siteId: string, token: string): Promise<ListInfo[]> {
  const lists: ListInfo[] = [];
  let next =
    `https://graph.microsoft.com/v1.0/sites/${siteId}/lists` +
    `?$select=id,name,displayName,webUrl&$top=200`;
  while (next) {
    const page = await graphGet(next, token);
    for (const l of page.value ?? []) {
      lists.push({ id: l.id, name: l.name, displayName: l.displayName, webUrl: l.webUrl });
    }
    next = page["@odata.nextLink"] ?? "";
  }
  return lists;
}

// Os nomes internos das listas perdem acentos ("Renovação" -> "Renovao"), por isso
// a busca compara tambem sem diacriticos.
function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findList(lists: ListInfo[], wanted: string): ListInfo | undefined {
  const w = wanted.trim().toLowerCase();
  return (
    lists.find((l) => l.id.toLowerCase() === w) ||
    lists.find((l) => (l.name || "").toLowerCase() === w) ||
    lists.find((l) => (l.displayName || "").toLowerCase() === w) ||
    lists.find((l) => norm(l.displayName) === norm(wanted)) ||
    lists.find((l) => norm(l.name) === norm(wanted))
  );
}

/** Util de diagnostico: nomes das listas disponiveis no site. */
export async function listAvailableLists(): Promise<ListInfo[]> {
  const token = await getAccessToken();
  const siteId = await resolveSiteId(token);
  return getAllLists(siteId, token);
}

/** Le todos os itens de uma lista e devolve os objetos "fields" crus (+ id/datas). */
async function fetchRawItems(listName: string): Promise<Record<string, unknown>[]> {
  const token = await getAccessToken();
  const siteId = await resolveSiteId(token);

  const lists = await getAllLists(siteId, token);
  const target = findList(lists, listName);
  if (!target) {
    const nomes = lists.map((l) => `"${l.displayName}" (interno: ${l.name})`).join(", ");
    throw new Error(
      `Lista "${listName}" nao encontrada no site. Listas disponiveis: ${nomes || "(nenhuma)"}.`,
    );
  }

  const out: Record<string, unknown>[] = [];
  let next =
    `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${target.id}/items` +
    `?expand=fields&$top=200`;

  while (next) {
    const page = await graphGet(next, token);
    for (const entry of page.value ?? []) {
      out.push({
        ...(entry.fields ?? {}),
        id: entry.id,
        Modified: entry.lastModifiedDateTime,
        Created: entry.createdDateTime,
      });
    }
    next = page["@odata.nextLink"] ?? "";
  }
  return out;
}

export async function fetchGastos(): Promise<Gasto[]> {
  const listName = process.env.SHAREPOINT_LIST_GASTOS || "Investimentos de TI";
  return (await fetchRawItems(listName)).map(normalizeGasto);
}

export async function fetchPrevistos(): Promise<Previsto[]> {
  const listName = process.env.SHAREPOINT_LIST_PREVISTO || "Budget de TI";
  return (await fetchRawItems(listName)).map(normalizePrevisto);
}

export async function fetchMetas(): Promise<Meta[]> {
  const listName = process.env.SHAREPOINT_LIST_META || "Valor Budget";
  const metas = (await fetchRawItems(listName))
    .map(normalizeMeta)
    .filter((m): m is Meta => m !== null);
  // Se houver mais de uma linha para o mesmo ano, a ultima vence.
  const byYear = new Map<number, Meta>();
  for (const m of metas) byYear.set(m.ano, m);
  return [...byYear.values()].sort((a, b) => a.ano - b.ano);
}
