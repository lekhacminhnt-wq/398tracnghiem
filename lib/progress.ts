import { prisma } from "./db";
import { EXAM_SET_ID } from "./exam";

export async function getUserLessonProgress(userId: string) {
  const attempts = await prisma.lessonAttempt.findMany({ where: { userId } });
  const map = new Map<
    string,
    { bestScore: number; total: number; passed: boolean; attempts: number }
  >();
  for (const a of attempts) {
    const cur = map.get(a.lessonId);
    map.set(a.lessonId, {
      bestScore: Math.max(cur?.bestScore ?? 0, a.score),
      total: a.total,
      passed: (cur?.passed ?? false) || a.passed,
      attempts: (cur?.attempts ?? 0) + 1,
    });
  }
  return map;
}

export async function getUserExamProgress(userId: string, examSetId: string) {
  const attempts = await prisma.examAttempt.findMany({
    where: { userId, examSetId, submittedAt: { not: null } },
  });
  if (attempts.length === 0) return null;
  return {
    bestScore: Math.max(...attempts.map((a) => a.score ?? 0)),
    total: attempts[0].total ?? 0,
    passed: attempts.some((a) => a.passed),
    attempts: attempts.length,
    lastAttemptAt: attempts.reduce(
      (max, a) => (a.createdAt > max ? a.createdAt : max),
      attempts[0].createdAt
    ),
  };
}

export async function getTopicsWithStatus(userId?: string) {
  const topics = await prisma.topic.findMany({
    orderBy: { order: "asc" },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  const progress = userId ? await getUserLessonProgress(userId) : new Map();

  let previousPassed = true; // bài học đầu tiên của chương trình luôn mở
  const result = topics.map((topic) => {
    const lessonsOut = topic.lessons.map((lesson) => {
      const p = progress.get(lesson.id);
      const passed = p?.passed ?? false;
      const unlocked = lesson.status === "READY" && previousPassed;
      previousPassed = passed;
      return {
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        status: lesson.status,
        passed,
        bestScore: p?.bestScore ?? null,
        attempts: p?.attempts ?? 0,
        unlocked,
      };
    });
    const readyCount = lessonsOut.filter((l) => l.status === "READY").length;
    const passedCount = lessonsOut.filter((l) => l.passed).length;
    return {
      id: topic.id,
      title: topic.title,
      lessonCount: topic.lessonCount,
      lessons: lessonsOut,
      readyCount,
      passedCount,
    };
  });
  return result;
}

// Đề sát hạch chỉ mở khi chuyên đề cuối cùng (hiện là Chuyên đề 26) đã hoàn thành toàn bộ bài học.
export function isExamUnlocked(topics: Awaited<ReturnType<typeof getTopicsWithStatus>>) {
  const finalTopic = topics[topics.length - 1];
  return Boolean(
    finalTopic &&
      finalTopic.lessons.length > 0 &&
      finalTopic.lessons.every((l) => l.status === "READY" && l.passed)
  );
}

export async function computeProgramCompletion(userId: string) {
  const topics = await getTopicsWithStatus(userId);
  const allLessons = topics.flatMap((t) => t.lessons);
  const totalLessons = allLessons.length;
  const passedLessons = allLessons.filter((l) => l.passed).length;
  const allReadyLessonsPassed = allLessons
    .filter((l) => l.status === "READY")
    .every((l) => l.passed);
  const allLessonsExist = allLessons.every((l) => l.status === "READY");
  const exam = await getUserExamProgress(userId, EXAM_SET_ID);
  const examPassed = exam?.passed ?? false;

  return {
    totalLessons,
    passedLessons,
    allReadyLessonsPassed,
    fullyComplete: allLessonsExist && allReadyLessonsPassed && examPassed,
    examPassed,
  };
}
