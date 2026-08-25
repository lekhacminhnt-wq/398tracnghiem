import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTopicsWithStatus, isExamUnlocked } from "@/lib/progress";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/dang-ky?next=/");

  const topics = await getTopicsWithStatus(session.id);
  const examUnlocked = isExamUnlocked(topics);
  const finalTopic = topics[topics.length - 1];

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

      <div className="mt-6">
        {examUnlocked ? (
          <Link
            href="/de-sat-hach"
            className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-primary-dark p-5 text-white shadow-md transition hover:shadow-lg hover:brightness-110"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                <span aria-hidden>★</span> Mở khoá
              </div>
              <div className="text-lg font-bold">Đề sát hạch cuối chương trình</div>
              <div className="text-sm text-white/85">
                50 câu · 90 phút · Đạt từ 70% số câu để được công nhận
              </div>
            </div>
            <div className="shrink-0 text-2xl" aria-hidden>
              →
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-brand-border bg-brand-bg p-5 opacity-80">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                🔒 Chưa mở
              </div>
              <div className="text-lg font-bold text-brand-text-muted">
                Đề sát hạch cuối chương trình
              </div>
              <div className="text-sm text-brand-text-muted">
                Hoàn thành toàn bộ Chuyên đề {finalTopic?.id ?? 26} để mở đề sát hạch
                {finalTopic ? ` (hiện đã đạt ${finalTopic.passedCount}/${finalTopic.lessonCount} bài)` : ""}.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
