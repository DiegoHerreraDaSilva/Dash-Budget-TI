"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

/** Marca desenhada — fallback se /public/logo.png nao carregar. */
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
  if (err) return <SchwabenMark />;
  return (
    <img
      src="/logo.png"
      alt="Schwaben Engineering"
      style={{ height: 44, width: "auto", maxWidth: 200, objectFit: "contain" }}
      onError={() => setErr(true)}
    />
  );
}
