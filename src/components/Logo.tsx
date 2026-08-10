"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useIsDark } from "./charts/palette";

/** Marca desenhada — fallback se os arquivos de logo nao carregarem. */
function SchwabenMark() {
  return (
    <div className="flex flex-col leading-none">
      <span className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
        Schwaben
      </span>
      <span
        className="text-[10px] font-semibold tracking-[0.25em] uppercase px-1 py-0.5 rounded-sm w-fit"
        style={{ background: "var(--brand)", color: "#fff" }}
      >
        Engineering
      </span>
    </div>
  );
}

export function Logo() {
  const [err, setErr] = useState(false);
  const dark = useIsDark();
  if (err) return <SchwabenMark />;
  return (
    <img
      // logo.png tem o texto em branco (para o header escuro); logo-light.png
      // tem o texto em cinza-escuro (para o header claro) — sem isso o texto
      // branco fica invisivel sobre o fundo claro.
      src={dark ? "/logo.png" : "/logo-light.png"}
      alt="Schwaben Engineering"
      style={{ height: 44, width: "auto", maxWidth: 200, objectFit: "contain" }}
      onError={() => setErr(true)}
    />
  );
}
