// Servidor customizado que restringe o acesso por IP de origem, direto na
// aplicacao (sem depender de firewall/proxy). Le o IP real da conexao TCP
// (req.socket.remoteAddress), que nao pode ser falsificado por header.
//
// Configuracao: variavel de ambiente ALLOWED_IPS, lista separada por virgula
// (IPs ou faixas CIDR simples). Se vazia/ausente, libera qualquer IP (modo
// dev). Exemplo no .env:
//   ALLOWED_IPS=10.0.0.15,10.0.0.16,192.168.1.0/24
const { createServer } = require("http");
const next = require("next");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

// Usado para servir o build de producao (npm run build); so entra em modo
// dev se DEV_SECURE=true for definido explicitamente.
const dev = process.env.DEV_SECURE === "true";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function normalizeIp(ip) {
  if (!ip) return ip;
  // Conexoes IPv4 chegam como "::ffff:x.x.x.x" quando o socket e dual-stack.
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

function ipToLong(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 256 + n, 0);
}

function matchesEntry(ip, entry) {
  if (!entry.includes("/")) return ip === entry;
  const [base, bitsStr] = entry.split("/");
  const bits = Number(bitsStr);
  const ipLong = ipToLong(ip);
  const baseLong = ipToLong(base);
  if (ipLong === null || baseLong === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipLong & mask) === (baseLong & mask);
}

const allowedIps = (process.env.ALLOWED_IPS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowed(ip) {
  if (allowedIps.length === 0) return true; // Sem lista configurada: nao restringe.
  if (!ip) return false;
  return allowedIps.some((entry) => matchesEntry(ip, entry));
}

app.prepare().then(() => {
  createServer((req, res) => {
    const ip = normalizeIp(req.socket.remoteAddress);

    if (!isAllowed(ip)) {
      console.warn(`[acesso negado] IP fora da allowlist: ${ip}`);
      res.statusCode = 403;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Acesso negado: este computador nao esta autorizado a acessar o dashboard.");
      return;
    }

    handle(req, res);
  }).listen(port, hostname, () => {
    console.log(`> Servidor rodando em http://${hostname}:${port}`);
    console.log(
      allowedIps.length > 0
        ? `> Acesso restrito a: ${allowedIps.join(", ")}`
        : "> ALLOWED_IPS nao definido - acesso liberado para qualquer IP.",
    );
  });
});
