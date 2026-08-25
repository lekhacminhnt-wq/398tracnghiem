import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { shuffle, isPassed } from "@/lib/scoring";
import { syncFullSummary } from "@/lib/sheets";

async function submitLesson(lessonId: string, formData: FormData) {
  "use server";

  const session = await getSession();
  if (!session) redirect(`/dang-ky?next=/bai-hoc/${lessonId}`);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
  });
  if (!lesson) notFound();

  const detail = lesson.questions.map((q) => {
    const selectedOptionId = String(formData.get(q.id) || "");
    const selected = q.options.find((o) => o.id === selectedOptionId);
    const correct = q.options.find((o) => o.isCorrect);
    return {
      questionId: q.id,
      questionText: q.text,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, label: o.label, text: o.text })),
      selectedOptionId: selected?.id ?? null,
      selectedLabel: selected?.label ?? null,
      correctOptionId: correct?.id ?? null,
      correctLabel: correct?.label ?? null,
      isCorrect: Boolean(selected && correct && selected.id === correct.id),
      explanation: q.explanation,
    };
  });

  const score = detail.filter((d) => d.isCorrect).length;
  const total = detail.length;
  const passed = isPassed(score, total);

  const attempt = await prisma.lessonAttempt.create({
    data: {
      userId: session.id,
      lessonId: lesson.id,
      score,
      total,
      passed,
      answers: detail,
    },
  });

  after(() => syncFullSummary());

  redirect(`/bai-hoc/${lessonId}/ket-qua/${attempt.id}`);
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const session = await getSession();
  if (!session) redirect(`/dang-ky?next=/bai-hoc/${lessonId}`);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      topic: true,
      questions: {
        orderBy: { order: "asc" },
        include: { options: { select: { id: true, label: true, text: true } } },
      },
    },
  });
  if (!lesson || lesson.status !== "READY") notFound();

  const questions = shuffle(lesson.questions).map((q) => ({
    ...q,
    options: shuffle(q.options),
  }));

  const submitWithId = submitLesson.bind(null, lessonId);

  return (
    <div>
      <Link href={`/chuyen-de/${lesson.topicId}`} className="mb-4 inline-block text-sm text-brand-primary">
        ← Chuyên đề {lesson.topicId}: {lesson.topic.title}
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">
        Bài {lesson.order}: {lesson.title}
      </h1>
      <p className="mb-6 text-sm text-brand-text-muted">
        5 câu hỏi · Trả lời đúng tối thiểu 70% (4/5 câu) để hoàn thành bài học. Thứ tự câu hỏi và
        đáp án được xáo trộn ngẫu nhiên mỗi lượt làm.
      </p>

      <form action={submitWithId} className="space-y-6">
        {questions.map((q, idx) => (
          <fieldset
            key={q.id}
            className={`rounded-xl border border-brand-border p-4 shadow-sm ${
              idx % 2 === 0 ? "bg-brand-stripe-light" : "bg-brand-stripe-dark"
            }`}
          >
            <legend className="mb-2 px-1 text-sm font-semibold text-brand-text">
              Câu {idx + 1}.{" "}
              <span className="font-normal text-brand-text-muted">
                ({q.type === "KNOWLEDGE" ? "kiểm tra kiến thức" : "tình huống công vụ"})
              </span>
            </legend>
            <p className="mb-3 font-medium text-brand-text">{q.text}</p>
            <div className="space-y-2">
              {q.options.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-brand-border hover:bg-brand-primary-soft"
                >
                  <input type="radio" name={q.id} value={o.id} required className="mt-1" />
                  <span className="text-sm text-brand-text">{o.text}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <button
          type="submit"
          className="w-full rounded-md bg-brand-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark cursor-pointer"
        >
          Nộp bài
        </button>
      </form>
    </div>
  );
}
