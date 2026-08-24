import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type AnswerDetail = {
  questionId: string;
  questionText: string;
  type: string;
  options: { id: string; label: string; text: string }[];
  selectedOptionId: string | null;
  selectedLabel: string | null;
  correctOptionId: string | null;
  correctLabel: string | null;
  isCorrect: boolean;
  explanation: string;
};

export default async function LessonResultPage({
  params,
}: {
  params: Promise<{ lessonId: string; attemptId: string }>;
}) {
  const { lessonId, attemptId } = await params;
  const session = await getSession();
  if (!session) redirect(`/dang-ky?next=/bai-hoc/${lessonId}`);

  const attempt = await prisma.lessonAttempt.findUnique({
    where: { id: attemptId },
    include: { lesson: { include: { topic: true } } },
  });
  if (!attempt || attempt.userId !== session.id) notFound();

  const answers = attempt.answers as unknown as AnswerDetail[];
  const nextLesson = await prisma.lesson.findFirst({
    where: { topicId: attempt.lesson.topicId, order: attempt.lesson.order + 1 },
  });

  return (
    <div>
      <Link
        href={`/chuyen-de/${attempt.lesson.topicId}`}
        className="mb-4 inline-block text-sm text-brand-primary"
      >
        ← Chuyên đề {attempt.lesson.topicId}: {attempt.lesson.topic.title}
      </Link>

      <div
        className={`mb-6 rounded-xl border p-5 text-center shadow-sm ${
          attempt.passed
            ? "border-green-300 bg-green-50 text-green-800"
            : "border-amber-300 bg-amber-50 text-amber-800"
        }`}
      >
        <div className="text-3xl font-extrabold">
          {attempt.score}/{attempt.total}
        </div>
        <div className="mt-1 font-semibold">
          {attempt.passed ? "✓ Đạt — đã hoàn thành bài học này" : "Chưa đạt (cần ≥70%)"}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/bai-hoc/${lessonId}`}
          className="rounded-md border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-primary-soft"
        >
          Làm lại bài này
        </Link>
        {attempt.passed && nextLesson && (
          <Link
            href={`/bai-hoc/${nextLesson.id}`}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark"
          >
            Bài tiếp theo →
          </Link>
        )}
        <Link
          href={`/chuyen-de/${attempt.lesson.topicId}`}
          className="rounded-md border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-primary-soft"
        >
          Về danh sách bài học
        </Link>
      </div>

      <div className="space-y-4">
        {answers.map((a, idx) => (
          <div
            key={a.questionId}
            className={`rounded-xl border p-4 shadow-sm ${
              a.isCorrect ? "border-green-200 bg-brand-surface" : "border-red-200 bg-brand-surface"
            }`}
          >
            <p className="mb-2 font-medium text-brand-text">
              Câu {idx + 1}. {a.questionText}
            </p>
            <ul className="mb-2 space-y-1 text-sm">
              {a.options.map((o) => {
                const isCorrectOpt = o.id === a.correctOptionId;
                const isChosen = o.id === a.selectedOptionId;
                return (
                  <li
                    key={o.id}
                    className={`rounded px-2 py-1 ${
                      isCorrectOpt
                        ? "bg-green-100 text-green-800"
                        : isChosen
                          ? "bg-red-100 text-red-800"
                          : "text-brand-text-muted"
                    }`}
                  >
                    {o.label}. {o.text}
                    {isCorrectOpt ? " ✓" : isChosen ? " ✗ (bạn chọn)" : ""}
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-brand-text-muted">
              <strong>Giải thích:</strong> {a.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
