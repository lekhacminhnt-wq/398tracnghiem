import { google } from "googleapis";
import { prisma } from "./db";
import { getTopicsWithStatus, getUserExamProgress } from "./progress";

function isConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID
  );
}

function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // .env thường lưu private key với \n dạng ký tự chuỗi, cần chuyển lại thành xuống dòng thật.
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Đồng bộ bất đồng bộ, best-effort — không bao giờ được làm hỏng luồng chính của người dùng.
export async function appendRegistration(user: {
  fullName: string;
  email: string;
  agency: string;
  phone: string;
  createdAt: Date;
}) {
  if (!isConfigured()) return;
  try {
    const sheets = getClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Đăng ký!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            user.fullName,
            user.email,
            user.agency,
            user.phone,
            user.createdAt.toISOString(),
          ],
        ],
      },
    });
  } catch (err) {
    console.error("[sheets] appendRegistration failed:", err);
  }
}

export async function syncFullSummary() {
  if (!isConfigured()) return;
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    const rows: (string | number)[][] = [
      [
        "Họ tên",
        "Email",
        "Cơ quan",
        "Số điện thoại",
        "Số bài đã đạt",
        "Tổng số bài",
        "Đề sát hạch",
        "Hoàn thành chương trình",
        "Ngày đăng ký",
      ],
    ];
    for (const u of users) {
      const topics = await getTopicsWithStatus(u.id);
      const allLessons = topics.flatMap((t) => t.lessons);
      const passedLessons = allLessons.filter((l) => l.passed).length;
      const readyLessons = allLessons.filter((l) => l.status === "READY");
      const exam = await getUserExamProgress(u.id, "demo");
      const fullyComplete =
        readyLessons.length > 0 &&
        readyLessons.every((l) => l.passed) &&
        allLessons.length === readyLessons.length &&
        (exam?.passed ?? false);
      rows.push([
        u.fullName,
        u.email,
        u.agency,
        u.phone,
        passedLessons,
        allLessons.length,
        exam ? (exam.passed ? "Đạt" : "Chưa đạt") : "Chưa làm",
        fullyComplete ? "Đã hoàn thành" : "Đang học",
        u.createdAt.toISOString(),
      ]);
    }

    const sheets = getClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Tổng hợp!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  } catch (err) {
    console.error("[sheets] syncFullSummary failed:", err);
  }
}
