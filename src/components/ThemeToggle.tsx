"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  const dark = theme === "dark";
  return (
    <button
      aria-label="Alternar tema"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="w-9 h-9 grid place-items-center rounded-lg border hover:bg-[var(--surface-2)] transition-colors"
      style={{ borderColor: "var(--border)" }}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
