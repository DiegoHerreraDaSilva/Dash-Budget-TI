"use client";
import { useEffect, useState } from "react";

/* ===========================================================================
   Rampas categoricas VALIDADAS com scripts/validate_palette.js da skill
   dataviz (checagens: banda de luminancia, piso de croma, separacao CVD,
   piso de visao normal, contraste vs superficie).
   Resultado: ALL CHECKS PASS nos dois modos, no check de pares adjacentes.

     dark  (superficie #1c2127): #0fa8a4 #d95926 #4f8fe6 #cf5a95 #9085e9
     light (superficie #ffffff): #00918c #c04d1f #2f6fd0 #b8437c #6c5fd0

   Nao trocar nenhum passo sem rodar o validador de novo.
   A ordem e FIXA por entidade — nunca por ranking, nunca ciclada.
   =========================================================================== */

const SERIES_DARK = ["#0fa8a4", "#d95926", "#4f8fe6", "#cf5a95", "#9085e9"];
const SERIES_LIGHT = ["#00918c", "#c04d1f", "#2f6fd0", "#b8437c", "#6c5fd0"];

/** Cor de "Outros" (o bucket de cauda) — cinza, fora da rampa de series. */
const OTHER_DARK = "#78838d";
const OTHER_LIGHT = "#8a949d";

export const OUTROS_KEY = "Outros";

/**
 * Categoria -> slot fixo. A mesma categoria tem a mesma cor em todas as abas,
 * e um filtro que muda a contagem de series nao repinta as sobreviventes.
 */
const CATEGORIA_SLOT: Record<string, number> = {
  Hardware: 0,
  Infraestrutura: 2,
  Licenciamento: 1,
  "Periféricos": 3,
  Perifericos: 3,
  "Serviço": 4,
  Servico: 4,
};

/**
 * Departamento -> slot. Conjunto de 3 validado tambem no check --pairs all
 * (todos os pares, nao so adjacentes), porque as tres barras aparecem juntas:
 *   dark  #0fa8a4 / #6478ee / #d95926   -> ALL CHECKS PASS
 *   light #00918c / #4b56d6 / #c04d1f   -> ALL CHECKS PASS
 */
const DEPARTAMENTO_DARK: Record<string, string> = {
  "T.I": "#0fa8a4",
  TI: "#0fa8a4",
  CAD: "#6478ee",
  ADM: "#d95926",
};
const DEPARTAMENTO_LIGHT: Record<string, string> = {
  "T.I": "#00918c",
  TI: "#00918c",
  CAD: "#4b56d6",
  ADM: "#c04d1f",
};

export type ColorMode = "categoria" | "departamento" | "serie" | "mono";

/** Detecta o tema lendo a classe do <html> (o toggle e do next-themes). */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function seriesRamp(dark: boolean): string[] {
  return dark ? SERIES_DARK : SERIES_LIGHT;
}

/**
 * Cor de uma chave. `idx` e a posicao na lista ja ordenada e serve apenas
 * como slot estavel para dimensoes livres (marca, produto, fornecedor...);
 * dimensoes com entidades conhecidas usam mapa fixo.
 */
export function colorFor(mode: ColorMode, key: string, idx: number, dark = true): string {
  if (key === OUTROS_KEY) return dark ? OTHER_DARK : OTHER_LIGHT;
  // Lista ranqueada longa: a cor nao codifica identidade (cada barra tem rotulo),
  // entao um unico tom e o correto — nunca ciclar a rampa categorica.
  if (mode === "mono") return "var(--accent)";
  const ramp = seriesRamp(dark);

  if (mode === "categoria") {
    const slot = CATEGORIA_SLOT[key];
    if (slot !== undefined) return ramp[slot];
  }
  if (mode === "departamento") {
    const fixed = (dark ? DEPARTAMENTO_DARK : DEPARTAMENTO_LIGHT)[key];
    if (fixed) return fixed;
  }
  // Slots 1..N para dimensoes livres; a partir do 6o item o chamador deve
  // dobrar a cauda em "Outros" (ver dobrarEmOutros), nunca ciclar a rampa.
  return ramp[Math.min(idx, ramp.length - 1)];
}

/** Gradiente sutil para preenchimento de barra/arco, derivado da cor base. */
export function gradientStops(cor: string): { from: string; to: string } {
  return {
    from: `color-mix(in srgb, ${cor} 100%, white 18%)`,
    to: cor,
  };
}

/** Sombra luminosa de uma marca ativa/hover. */
export function glow(cor: string, forca = 6): string {
  return `drop-shadow(0 0 ${forca}px ${cor})`;
}
