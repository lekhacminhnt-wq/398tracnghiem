"use client";

import { useEffect, useRef, useState } from "react";

export default function ExamCountdown({
  deadline,
  formId,
}: {
  deadline: number; // epoch ms
  formId: string;
}) {
  const [remainingMs, setRemainingMs] = useState(deadline - Date.now());
  const submittedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const ms = deadline - Date.now();
      setRemainingMs(ms);
      if (ms <= 0 && !submittedRef.current) {
        submittedRef.current = true;
        const form = document.getElementById(formId) as HTMLFormElement | null;
        form?.requestSubmit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, formId]);

  const clamped = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const low = totalSeconds <= 300; // dưới 5 phút -> cảnh báo

  return (
    <div
      className={`sticky top-2 z-10 mb-4 rounded-lg border px-4 py-2 text-center font-mono text-lg font-bold shadow-sm ${
        low ? "border-red-300 bg-red-50 text-red-700" : "border-brand-border bg-brand-surface text-brand-primary"
      }`}
      role="timer"
      aria-live="polite"
    >
      ⏱ Thời gian còn lại: {mm}:{ss}
    </div>
  );
}
