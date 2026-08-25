import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUserExamProgress, getTopicsWithStatus, isExamUnlocked } from "@/lib/progress";
import { shuffle } from "@/lib/scoring";
import { EXAM_SET_ID, EXAM_DURATION_MINUTES, examDeadline } from "@/lib/exam";

async function startExam() {
  "use server";

  const session = await getSession();
  if (!session) redirect("/dang-ky?next=/de-sat-hach");

  const topics = await getTopicsWithStatus(session.id);
  if (!isExamUnlocked(topics)) redirect("/de-sat-hach");

  const questions = await prisma.question.findMany({
    where: { examSetId: EXAM_SET_ID },
    include: { options: { select: { id: true } } },
    orderBy: { order: "asc" },
  });

  const questionOrder = shuffle(questions).map((q) => ({
    questionId: q.id,
    optionOrder: shuffle(q.options).map((o) => o.id),
  }));

  const attempt = await prisma.examAttempt.create({
    data: {
      userId: session.id,
      examSetId: EXAM_SET_ID,
      questionOrder,
      startedAt: new Date(),
    },
  });

  redirect(`/de-sat-hach/lam-bai/${attempt.id}`);
}

export default async function DeSatHachPage() {
  const session = await getSession();
  const result = session ? await getUserExamProgress(session.id, EXAM_SET_ID) : null;

  let inProgress: { id: string } | null = null;
  let unlocked = false;
  let finalTopic: Awaited<ReturnType<typeof getTopicsWithStatus>>[number] | undefined;
  if (session) {
    const topics = await getTopicsWithStatus(session.id);
    unlocked = isExamUnlocked(topics);
    finalTopic = topics[topics.length - 1];

    const now = new Date();
    const candidate = await prisma.examAttempt.findFirst({
      where: { userId: session.id, examSetId: EXAM_SET_ID, submittedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (candidate && examDeadline(candidate.startedAt) > now) {
      inProgress = candidate;
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">Đề sát hạch cuối chương trình</h1>
      <p className="mb-1 text-sm font-semibold text-amber-700">
        ĐỀ THỬ NGHIỆM (20 câu, lấy từ 7 chuyên đề đã có dữ liệu) — chưa phải đề chính thức 50 câu
        theo Phụ lục 3.
      </p>
      <p className="mb-6 text-sm text-brand-text-muted">
        Thời gian làm bài: {EXAM_DURATION_MINUTES} phút, hệ thống hiển thị đồng hồ đếm ngược và tự
        động thu bài khi hết giờ. Bạn có thể nộp bài sớm. Đạt từ 70% số câu trở lên để được công
        nhận đạt. Số lần làm lại không giới hạn.
      </p>

      {result && (
        <div className="mb-6 rounded-xl border border-brand-border bg-brand-primary-soft p-4 text-sm">
          Kết quả tốt nhất: <strong>{result.bestScore}/{result.total}</strong> —{" "}
          {result.passed ? (
            <span className="font-semibold text-green-700">Đạt</span>
          ) : (
            <span className="font-semibold text-amber-700">Chưa đạt</span>
          )}{" "}
          (đã làm {result.attempts} lượt)
        </div>
      )}

      {inProgress ? (
        <a
          href={`/de-sat-hach/lam-bai/${inProgress.id}`}
          className="inline-block rounded-md bg-brand-primary px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-primary-dark"
        >
          Tiếp tục bài đang làm dở →
        </a>
      ) : unlocked ? (
        <form action={startExam}>
          <button
            type="submit"
            className="rounded-md bg-brand-primary px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark cursor-pointer"
          >
            Bắt đầu làm bài
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-bg p-4 text-sm text-brand-text-muted">
          🔒 Chưa mở — hoàn thành toàn bộ Chuyên đề {finalTopic?.id ?? 26} để mở đề sát hạch
          {finalTopic ? ` (hiện đã đạt ${finalTopic.passedCount}/${finalTopic.lessonCount} bài)` : ""}.
          {!session && (
            <>
              {" "}
              <a href="/dang-ky?next=/de-sat-hach" className="font-semibold text-brand-primary">
                Đăng ký / đăng nhập
              </a>{" "}
              để xem tiến trình của bạn.
            </>
          )}
        </div>
      )}
    </div>
  );
}
