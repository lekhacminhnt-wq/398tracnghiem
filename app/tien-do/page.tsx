import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTopicsWithStatus, getUserExamProgress, computeProgramCompletion } from "@/lib/progress";
import { EXAM_SET_ID } from "@/lib/exam";

export default async function TienDoPage() {
  const session = await getSession();
  if (!session) redirect("/dang-ky?next=/tien-do");

  const topics = await getTopicsWithStatus(session.id);
  const exam = await getUserExamProgress(session.id, EXAM_SET_ID);
  const completion = await computeProgramCompletion(session.id);

  const allLessons = topics.flatMap((t) => t.lessons);
  const readyLessons = allLessons.filter((l) => l.status === "READY");
  const passedReady = readyLessons.filter((l) => l.passed).length;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">Tiến trình học tập</h1>
      <p className="mb-6 text-sm text-brand-text-muted">
        {session.fullName} · {session.agency} · {session.email}
      </p>

      {completion.fullyComplete && (
        <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-5 text-center">
          <div className="text-2xl">🎓</div>
          <div className="mt-1 font-bold text-green-800">
            Đã hoàn thành chương trình — đạt tất cả bài học và đề sát hạch!
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Bài học đã đạt (trong số đã có dữ liệu)"
          value={`${passedReady}/${readyLessons.length}`}
        />
        <StatCard
          label="Đề sát hạch"
          value={exam ? `${exam.bestScore}/${exam.total} (${exam.passed ? "Đạt" : "Chưa đạt"})` : "Chưa làm"}
        />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-brand-text">Theo chuyên đề</h2>
      <div className="space-y-2">
        {topics.map((t) => (
          <Link
            key={t.id}
            href={`/chuyen-de/${t.id}`}
            className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-surface p-3 text-sm shadow-sm hover:shadow-md"
          >
            <span className="text-brand-text">
              Chuyên đề {t.id}: {t.title}
            </span>
            <span className="font-semibold text-brand-primary">
              {t.passedCount}/{t.lessonCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <div className="text-2xl font-extrabold text-brand-primary">{value}</div>
      <div className="mt-1 text-sm text-brand-text-muted">{label}</div>
    </div>
  );
}
