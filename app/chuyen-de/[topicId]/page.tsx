import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTopicsWithStatus } from "@/lib/progress";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const session = await getSession();
  const { topicId } = await params;
  if (!session) redirect(`/dang-ky?next=/chuyen-de/${topicId}`);

  const topics = await getTopicsWithStatus(session.id);
  const topic = topics.find((t) => t.id === Number(topicId));
  if (!topic) notFound();

  return (
    <div>
      <Link href="/chuyen-de" className="mb-4 inline-block text-sm text-brand-primary">
        ← Danh sách chuyên đề
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">
        Chuyên đề {topic.id}: {topic.title}
      </h1>
      <p className="mb-6 text-sm text-brand-text-muted">
        {topic.passedCount}/{topic.lessonCount} bài đã đạt
      </p>

      <ol className="space-y-2">
        {topic.lessons.map((lesson) => {
          const clickable = lesson.status === "READY" && lesson.unlocked;
          const content = (
            <div
              className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${
                clickable
                  ? "border-brand-border bg-brand-surface shadow-sm hover:shadow-md"
                  : "border-dashed border-brand-border bg-brand-bg opacity-70"
              }`}
            >
              <div>
                <span className="mr-2 text-xs font-semibold text-brand-text-muted">
                  Bài {lesson.order}
                </span>
                <span className="font-medium text-brand-text">{lesson.title}</span>
              </div>
              <div className="shrink-0 text-xs">
                {lesson.status === "PENDING" ? (
                  <span className="rounded-full bg-brand-primary-soft px-2 py-1 text-brand-primary">
                    Sắp cập nhật
                  </span>
                ) : lesson.passed ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                    ✓ Đã đạt ({lesson.bestScore}/5)
                  </span>
                ) : clickable ? (
                  <span className="rounded-full bg-brand-primary px-2 py-1 text-white">
                    {lesson.attempts > 0 ? "Làm lại" : "Bắt đầu"}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-500">
                    🔒 Chưa mở
                  </span>
                )}
              </div>
            </div>
          );
          return (
            <li key={lesson.id}>
              {clickable ? <Link href={`/bai-hoc/${lesson.id}`}>{content}</Link> : content}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
