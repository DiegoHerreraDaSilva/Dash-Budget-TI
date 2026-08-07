# Schwaben Budget de TI — Dashboard

Painel de budget e investimentos de TI da Schwaben Engineering, no estilo Power BI
(cross-filter em todos os gráficos), lendo os dados **ao vivo** do SharePoint via
Microsoft Graph.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Zustand ·
next-themes · lucide-react. Gráficos em SVG puro, sem biblioteca de charts.

## Abas

| Rota | Aba | Fonte |
|---|---|---|
| `/` | **Geral** — panorama do investimento realizado | lista `Investimentos de TI` |
| `/budget` | **Budget T.I** — realizado contra o teto do ano | `Investimentos de TI` + `Valor Budget` |
| `/previsto` | **Budget Previsto** — planejamento do ano | lista `Budget de TI` |

O **seletor de período** no header recorta as três abas de uma vez: um ano
específico ou **"Todos os anos"** (acumulado). No acumulado o seletor fica
destacado com ícone `Σ`, o teto do gauge passa a ser a **soma das metas anuais**,
e os gráficos de evolução trocam o eixo de mês para **ano** — somar os janeiros de
anos diferentes numa série temporal não diria nada. Clicar num ano nesse gráfico
faz drill-down para aquele ano.

Regras do ano selecionado ([year.ts](src/lib/year.ts) + [useBudget.ts](src/lib/useBudget.ts)):

- O seletor só oferece anos que **existem nos dados** — nunca o ano do relógio.
- Padrão: ano mais recente com gasto lançado.
- A escolha do usuário fica no `localStorage`, que é **por origem** —
  `localhost:3001` e `192.168.x.x:3001` têm preferências separadas.
- `reconcile()` valida o ano salvo contra os anos disponíveis. Se não existir
  (lista esvaziada, valor gravado por engano), o valor é descartado e volta ao
  padrão — em vez de abrir o painel vazio.
- Enquanto a primeira busca não volta, o painel mostra estado de carregamento;
  não renderiza um ano provisório.

## Acesso pela rede

`npm run dev` escuta em `0.0.0.0:3001`, então outras máquinas do domínio abrem
por `http://<ip-da-máquina>:3001`. A regra de entrada do Node no firewall
(perfil Domain) já permite isso.

**Atenção — o dev server precisa liberar a origem.** O Next 16 bloqueia os
recursos `/_next/*` quando a origem não é `localhost`. O sintoma é cruel: o HTML
chega (HTTP 200), mas os chunks do cliente não, o React nunca hidrata e o painel
fica preso em "Carregando dados do SharePoint..." para sempre — sem erro visível.

O [next.config.mjs](next.config.mjs) resolve isso detectando os IPv4 da máquina
em tempo de execução e passando-os em `allowedDevOrigins`. É detecção dinâmica de
propósito: o IP muda por DHCP e um valor fixo quebraria na próxima renovação.
Para liberar um host extra (nome DNS, proxy):

```bash
DEV_ALLOWED_ORIGINS=painel.schwaben.local npm run dev
```

**Para uso real na rede, prefira produção** — sem HMR, sem essa restrição e bem
mais rápido:

```bash
npm run build
npm run start:lan
```

Nota: um `GET /_next/webpack-hmr 404` no log é normal — este projeto usa
Turbopack, que tem outro canal de HMR. Não é a causa de nada.

### Restringir por IP (`start:secure`)

Sem proxy reverso na frente, nem o firewall do Windows nem um middleware do
Next resolvem isso de forma confiável: o firewall é fácil de desconfigurar sem
querer, e headers como `X-Forwarded-For` não significam nada sem um proxy que
os popule — qualquer cliente pode mandar o header que quiser.

[server.js](server.js) resolve isso na camada de aplicação: um servidor HTTP
customizado que envolve o Next e, antes de repassar cada requisição, lê o IP
**da conexão TCP** (`req.socket.remoteAddress`) — não falsificável por header —
contra a lista em `ALLOWED_IPS` (`.env`, aceita IP individual e faixa CIDR).
Fora da lista, responde `403` sem chamar o Next.

```bash
npm run build
npm run start:secure
```

Sem `ALLOWED_IPS` definida, libera qualquer IP — não muda o comportamento atual
enquanto a lista não for configurada. No Windows, `build-servidor.bat` e
`iniciar-servidor.bat` automatizam o build e a subida deste modo.

## Rodar

O painel sobe na **porta 3001** (a 3000 fica livre para outros projetos):

```bash
npm install
npm run dev
```

→ http://localhost:3001

Produção:

```bash
npm run build
npm start
```

Para expor na rede local (outras máquinas do escritório):

```bash
npm run start:lan
```

## Configuração (Graph)

Copie `.env.example` para `.env` e preencha.

O App Registration precisa da permissão de **aplicação** `Sites.Selected` — o
privilégio mínimo, que alcança apenas os sites com concessão explícita de leitura
— com consentimento do administrador, mais um Client Secret válido.

O tenant, o client id e o caminho do site ficam **só no `.env` local** (não
versionado). Peça os valores a quem administra o ambiente.

```
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
SHAREPOINT_HOSTNAME=<tenant>.sharepoint.com
SHAREPOINT_SITE_PATH=/sites/<nome-do-site>
SHAREPOINT_LIST_GASTOS=Investimentos de TI
SHAREPOINT_LIST_PREVISTO=Budget de TI
SHAREPOINT_LIST_META=Valor Budget
USE_SEED_DATA=false
```

- `USE_SEED_DATA=true` ignora o Graph e usa o snapshot local de `src/lib/seed.ts`
  (útil para rodar sem credenciais). Se o Graph falhar com `false`, o painel cai
  nesse snapshot e mostra um aviso no topo em vez de quebrar.
- Diagnóstico das listas do site: `GET /api/budget?debug=lists`.

## Como os dados são lidos

`GET /api/budget` (sempre dinâmico, sem cache) lê as três listas em paralelo e
devolve `{ gastos, previstos, metas, source, error }`. O cliente busca uma vez e
compartilha o resultado entre as abas (`src/lib/useBudget.ts`); o botão
**Atualizar** rebusca e propaga para todos os componentes montados.

Dois detalhes das listas que o normalizador trata (`src/lib/fieldMap.ts`):

- **`Data de Aquisição` é texto `dd/MM/yyyy`**, não data — é convertida para ISO
  (e `ano`/`mes` derivados). `Data Prevista`, na outra lista, já é datetime.
- **`Quantidade` é texto** em `Investimentos de TI`; vira número com piso 1.
- **`Preço Unitário` não existe como coluna** — é derivado (`Valor / Quantidade`).
- `Setor` (realizado) e `Departamento` (previsto) são unificados como
  `departamento`.

## Cross-filter

Clicar em qualquer barra, fatia, item de progresso, departamento ou ponto do
gráfico de meses aplica um filtro global. Os gráficos recebem a base **sem**
filtros de dimensão e aplicam `applyFilters(items, filters, dim)` internamente,
ignorando a própria dimensão — então o gráfico clicado não colapsa numa única
barra, exatamente como no Power BI. KPIs e tabela usam o conjunto totalmente
filtrado.

As abas **Geral** e **Budget T.I** compartilham o mesmo namespace de filtros
(ambas operam sobre o realizado). **Budget Previsto** tem namespace próprio,
porque as mesmas colunas têm valores diferentes lá (`Tipo_` é
Renovação/Aquisição no previsto e Notebook/Workstation no realizado).

## Cores dos gráficos

As duas rampas categóricas em [palette.ts](src/components/charts/palette.ts) foram
validadas com o script de checagem da skill `dataviz` (banda de luminância, piso
de croma, separação para daltonismo, piso de visão normal e contraste contra a
superfície) — **ALL CHECKS PASS** nos dois temas:

```
dark  (superfície #1c2127): #0fa8a4 #d95926 #4f8fe6 #cf5a95 #9085e9
light (superfície #ffffff): #00918c #c04d1f #2f6fd0 #b8437c #6c5fd0
```

O trio de departamento (T.I / CAD / ADM) passa também no check mais estrito
`--pairs all`, porque as três barras aparecem sempre juntas.

Regras que valem ao mexer nisso:

- **Não trocar nenhum passo sem rodar o validador de novo.**
- Cor segue a **entidade**, nunca o ranking — "Hardware" tem a mesma cor em todas
  as abas, e filtrar não repinta as séries que sobraram.
- A rampa **não é ciclada**: dimensões com muitos valores (Marca, Produto) dobram
  a cauda num bucket **"Outros"** (cinza, fora da rampa), então o total fecha 100%.
- Listas ranqueadas longas (Sub-Categorias, Produtos, Top Fornecedores) usam
  `colorMode="mono"`: um único tom, porque ali a cor não codifica identidade — cada
  barra já tem rótulo próprio.
- Os tons de status (verde / âmbar / vermelho do gauge e dos KPIs) são reservados e
  sempre acompanhados de rótulo e ícone, nunca sinalizam só pela cor.

## Observação sobre qualidade dos dados

A lista `Investimentos de TI` tem valores que diferem só na caixa —
`"Ar Condicionado"` e `"Ar condicionado"` aparecem como duas sub-categorias
distintas nos gráficos. O painel é fiel à lista e não normaliza isso; a correção
é editar os itens no SharePoint.
