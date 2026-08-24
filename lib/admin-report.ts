import { prisma } from "./db";
import { getTopicsWithStatus, getUserExamProgress } from "./progress";
import { EXAM_SET_ID } from "./exam";

export async function getUserDetailRows() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const rows = [];
  for (const u of users) {
    const topics = await getTopicsWithStatus(u.id);
    const allLessons = topics.flatMap((t) => t.lessons);
    const readyLessons = allLessons.filter((l) => l.status === "READY");
    const passedLessons = readyLessons.filter((l) => l.passed).length;
    const exam = await getUserExamProgress(u.id, EXAM_SET_ID);
    const fullyComplete =
      readyLessons.length > 0 &&
      readyLessons.every((l) => l.passed) &&
      allLessons.length === readyLessons.length &&
      (exam?.passed ?? false);

    rows.push({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      agency: u.agency,
      phone: u.phone,
      passedLessons,
      totalReadyLessons: readyLessons.length,
      examBest: exam ? `${exam.bestScore}/${exam.total}` : "—",
      examPassed: exam?.passed ?? false,
      fullyComplete,
      createdAt: u.createdAt,
    });
  }
  return rows;
}

export function summarizeByAgency(rows: Awaited<ReturnType<typeof getUserDetailRows>>) {
  const map = new Map<string, { agency: string; total: number; completed: number }>();
  for (const r of rows) {
    const cur = map.get(r.agency) ?? { agency: r.agency, total: 0, completed: 0 };
    cur.total += 1;
    if (r.fullyComplete) cur.completed += 1;
    map.set(r.agency, cur);
  }
  return [...map.values()].sort((a, b) => a.agency.localeCompare(b.agency, "vi"));
}
