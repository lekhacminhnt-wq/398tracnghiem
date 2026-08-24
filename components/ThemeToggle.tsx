"use client";

import { useEffect, useState } from "react";

type Theme = "do-vang" | "xanh-trang";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("do-vang");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "do-vang";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "do-vang" ? "xanh-trang" : "do-vang";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-sm font-medium text-brand-text shadow-sm transition hover:shadow-md cursor-pointer"
      aria-label="Đổi bảng màu giao diện"
      title="Đổi bảng màu giao diện"
    >
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ background: "var(--brand-primary)" }}
      />
      <span className="hidden sm:inline">
        {theme === "do-vang" ? "Đỏ – Vàng" : "Xanh dương – Trắng"}
      </span>
      <span aria-hidden>⇄</span>
    </button>
  );
}
