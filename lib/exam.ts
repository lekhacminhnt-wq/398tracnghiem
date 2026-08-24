import { prisma } from "./db";

export const EXAM_SET_ID = "demo"; // đổi thành "official" khi có đủ 50 câu Phần II chính thức
export const EXAM_DURATION_MINUTES = 90;
export const EXAM_PASS_RATIO = 0.7;

export type QuestionOrderEntry = { questionId: string; optionOrder: string[] };

export async function loadOrderedQuestions(questionOrder: QuestionOrderEntry[]) {
  const questionIds = questionOrder.map((q) => q.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { options: { select: { id: true, label: true, text: true } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  return questionOrder
    .map((entry) => {
      const q = byId.get(entry.questionId);
      if (!q) return null;
      const optById = new Map(q.options.map((o) => [o.id, o]));
      const options = entry.optionOrder.map((id) => optById.get(id)).filter(Boolean) as {
        id: string;
        label: string;
        text: string;
      }[];
      return { id: q.id, text: q.text, type: q.type, options };
    })
    .filter(Boolean) as {
    id: string;
    text: string;
    type: string;
    options: { id: string; label: string; text: string }[];
  }[];
}

export function examDeadline(startedAt: Date) {
  return new Date(startedAt.getTime() + EXAM_DURATION_MINUTES * 60 * 1000);
}
