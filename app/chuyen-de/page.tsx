import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTopicsWithStatus } from "@/lib/progress";

export default async function ChuyenDePage() {
  const session = await getSession();
  if (!session) redirect("/dang-ky?next=/chuyen-de");

  const topics = await getTopicsWithStatus(session.id);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">26 chuyên đề · 136 bài học</h1>
      <p className="mb-6 text-sm text-brand-text-muted">
        Học tuần tự từ Chuyên đề 1. Hoàn thành (≥70%) một bài để mở bài tiếp theo.
      </p>

      <div className="space-y-3">
        {topics.map((t) => (
          <Link
            key={t.id}
            href={`/chuyen-de/${t.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm transition hover:shadow-md"
          >
            <div>
              <div className="text-xs font-semibold text-brand-text-muted">Chuyên đề {t.id}</div>
              <div className="font-semibold text-brand-text">{t.title}</div>
              {t.readyCount === 0 && (
                <span className="mt-1 inline-block rounded-full bg-brand-primary-soft px-2 py-0.5 text-xs text-brand-primary">
                  Sắp cập nhật
                </span>
              )}
            </div>
            <div className="shrink-0 text-right text-sm">
              <div className="font-semibold text-brand-primary">
                {t.passedCount}/{t.lessonCount}
              </div>
              <div className="text-xs text-brand-text-muted">bài đã đạt</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
