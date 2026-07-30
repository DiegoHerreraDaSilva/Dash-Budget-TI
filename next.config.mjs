import os from "node:os";

/**
 * IPs IPv4 das interfaces de rede desta máquina.
 *
 * O dev server do Next 16 bloqueia os recursos /_next/* quando a origem não é
 * localhost. Sem liberar o IP, abrir http://<ip>:3001 entrega o HTML mas não os
 * chunks do cliente: o React não hidrata e o painel fica preso em "Carregando".
 *
 * Detectado em tempo de execução de propósito — o IP da máquina muda (DHCP), e
 * um valor fixo no arquivo quebraria de novo na próxima renovação de lease.
 */
function ipsDaRede() {
  const ips = new Set();
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const ni of interfaces ?? []) {
      if (ni.family === "IPv4" && !ni.internal) ips.add(ni.address);
    }
  }
  return [...ips];
}

// Hosts extras (ex.: nome DNS da máquina) via env: DEV_ALLOWED_ORIGINS=a,b
const extras = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Só tem efeito em `next dev`; o build de produção não usa recursos /_next/ de HMR.
  allowedDevOrigins: [...ipsDaRede(), os.hostname(), ...extras],
};

export default nextConfig;
