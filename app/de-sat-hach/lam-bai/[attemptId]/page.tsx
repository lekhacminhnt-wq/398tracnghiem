import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isPassed } from "@/lib/scoring";
import { loadOrderedQuestions, examDeadline, type QuestionOrderEntry } from "@/lib/exam";
import { syncFullSummary } from "@/lib/sheets";
import ExamCountdown from "@/components/ExamCountdown";

const FORM_ID = "exam-form";

async function finalizeAttempt(attemptId: string, formData: FormData | null) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) notFound();
  if (attempt.submittedAt) return; // đã nộp rồi, tránh chấm lại

  const order = (attempt.questionOrder as unknown as QuestionOrderEntry[]) ?? [];
  const questions = await prisma.question.findMany({
    where: { id: { in: order.map((o) => o.questionId) } },
    include: { options: true },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  const detail = order.map((entry) => {
    const q = byId.get(entry.questionId)!;
    const selectedOptionId = formData ? String(formData.get(entry.questionId) || "") : "";
    const selected = q.options.find((o) => o.id === selectedOptionId);
    const correct = q.options.find((o) => o.isCorrect);
    return {
      questionId: q.id,
      questionText: q.text,
      type: q.type,
      options: entry.optionOrder
        .map((id) => q.options.find((o) => o.id === id))
        .filter(Boolean)
        .map((o) => ({ id: o!.id, label: o!.label, text: o!.text })),
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

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      total,
      passed: isPassed(score, total),
      answers: detail,
      submittedAt: new Date(),
    },
  });

  after(() => syncFullSummary());
}

async function submitExam(attemptId: string, formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect(`/dang-ky?next=/de-sat-hach`);
  await finalizeAttempt(attemptId, formData);
  redirect(`/de-sat-hach/lam-bai/${attemptId}/ket-qua`);
}

export default async function ExamTakingPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const session = await getSession();
  if (!session) redirect(`/dang-ky?next=/de-sat-hach`);

  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== session.id) notFound();

  if (attempt.submittedAt) {
    redirect(`/de-sat-hach/lam-bai/${attemptId}/ket-qua`);
  }

  const deadline = examDeadline(attempt.startedAt);
  if (deadline.getTime() <= Date.now()) {
    // Hết giờ nhưng chưa nộp (vd. đóng tab) -> hệ thống tự động thu bài với các câu chưa trả lời.
    await finalizeAttempt(attemptId, null);
    redirect(`/de-sat-hach/lam-bai/${attemptId}/ket-qua`);
  }

  const order = (attempt.questionOrder as unknown as QuestionOrderEntry[]) ?? [];
  const questions = await loadOrderedQuestions(order);
  const submitWithId = submitExam.bind(null, attemptId);

  return (
    <div>
      <ExamCountdown deadline={deadline.getTime()} formId={FORM_ID} />
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">Đề sát hạch — Đang làm bài</h1>
      <p className="mb-6 text-sm text-brand-text-muted">
        {questions.length} câu hỏi. Trả lời hết rồi bấm “Nộp bài” — hoặc hệ thống sẽ tự động nộp
        khi hết giờ.
      </p>

      <form id={FORM_ID} action={submitWithId} className="space-y-6">
        {questions.map((q, idx) => (
          <fieldset
            key={q.id}
            className="rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm"
          >
            <legend className="mb-2 px-1 text-sm font-semibold text-brand-text">
              Câu {idx + 1}
            </legend>
            <p className="mb-3 font-medium text-brand-text">{q.text}</p>
            <div className="space-y-2">
              {q.options.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-brand-border hover:bg-brand-primary-soft"
                >
                  <input type="radio" name={q.id} value={o.id} className="mt-1" />
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
