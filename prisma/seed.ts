import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.join(__dirname, "..", "data");

type RawOption = { A: string; B: string; C: string; D?: string };
type RawQuestion = {
  order: number;
  type: string;
  text: string;
  options: RawOption;
  explanation: string;
  correctLabel: string;
  isTrueFalse: boolean;
  source: string;
};
type RawLessonFile = {
  topicId: number;
  lessons: { lessonOrder: number; lessonTitle: string; questions: RawQuestion[] }[];
};

async function main() {
  const { topics, lessons } = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "topics.json"), "utf8")
  ) as {
    topics: { id: number; title: string; lessonCount: number }[];
    lessons: { topicId: number; order: number; title: string; status: string }[];
  };

  console.log(`Seeding ${topics.length} topics, ${lessons.length} lessons...`);

  for (const t of topics) {
    await prisma.topic.upsert({
      where: { id: t.id },
      update: { title: t.title, lessonCount: t.lessonCount, order: t.id },
      create: { id: t.id, title: t.title, lessonCount: t.lessonCount, order: t.id },
    });
  }

  const lessonIdByKey = new Map<string, string>();
  for (const l of lessons) {
    const row = await prisma.lesson.upsert({
      where: { topicId_order: { topicId: l.topicId, order: l.order } },
      update: { title: l.title, status: l.status },
      create: { topicId: l.topicId, order: l.order, title: l.title, status: l.status },
    });
    lessonIdByKey.set(`${l.topicId}-${l.order}`, row.id);
  }

  // Wipe existing questions/options to make this script idempotent for re-seeding during dev.
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});

  const readyTopics = Array.from({ length: 26 }, (_, i) => i + 1);
  let qCount = 0;
  for (const topicId of readyTopics) {
    const file = path.join(DATA_DIR, "questions", `chuyen-de-${String(topicId).padStart(2, "0")}.json`);
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as RawLessonFile;
    for (const lesson of raw.lessons) {
      const lessonId = lessonIdByKey.get(`${topicId}-${lesson.lessonOrder}`);
      if (!lessonId) continue;
      for (const q of lesson.questions) {
        const question = await prisma.question.create({
          data: {
            lessonId,
            order: q.order,
            type: q.type,
            text: q.text,
            explanation: q.explanation,
            isTrueFalse: q.isTrueFalse,
            source: q.source,
          },
        });
        const entries = Object.entries(q.options) as [string, string][];
        for (const [label, text] of entries) {
          await prisma.option.create({
            data: {
              questionId: question.id,
              label,
              text,
              isCorrect: label === q.correctLabel,
            },
          });
        }
        qCount++;
      }
    }
  }
  console.log(`Seeded ${qCount} lesson questions.`);

  // Đề sát hạch chính thức (Phần II, Phụ lục 3 — 50 câu)
  const official = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "questions", "official-exam.json"), "utf8")
  ) as { examSetId: string; questions: RawQuestion[] };

  await prisma.option.deleteMany({ where: { question: { examSetId: official.examSetId } } });
  await prisma.question.deleteMany({ where: { examSetId: official.examSetId } });

  let idx = 1;
  for (const q of official.questions) {
    const question = await prisma.question.create({
      data: {
        examSetId: official.examSetId,
        order: idx++,
        type: q.type,
        text: q.text,
        explanation: q.explanation,
        isTrueFalse: q.isTrueFalse,
        source: q.source,
      },
    });
    const entries = Object.entries(q.options) as [string, string][];
    for (const [label, text] of entries) {
      await prisma.option.create({
        data: { questionId: question.id, label, text, isCorrect: label === q.correctLabel },
      });
    }
  }
  console.log(`Seeded ${official.questions.length} official-exam questions.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
