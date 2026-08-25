"use client";

import { useEffect, useState } from "react";

const THEMES = ["do-vang", "xanh-trang", "tim-hue", "ngoc-phi-thuy"] as const;
type Theme = (typeof THEMES)[number];

const THEME_LABELS: Record<Theme, string> = {
  "do-vang": "Đỏ – Vàng",
  "xanh-trang": "Xanh dương – Trắng",
  "tim-hue": "Tím Huế",
  "ngoc-phi-thuy": "Ngọc phỉ thúy",
};

function isTheme(value: string | null): value is Theme {
  return !!value && (THEMES as readonly string[]).includes(value);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("do-vang");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(isTheme(current) ? current : "do-vang");
  }, []);

  function toggle() {
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-sm font-medium text-brand-text shadow-sm transition hover:shadow-md cursor-pointer"
      aria-label={`Đổi giao diện — hiện tại: ${THEME_LABELS[theme]}`}
      title={`Đổi giao diện — hiện tại: ${THEME_LABELS[theme]}`}
    >
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ background: "var(--brand-primary)" }}
      />
      <span className="hidden sm:inline">Style</span>
      <span aria-hidden>⇄</span>
    </button>
  );
}
