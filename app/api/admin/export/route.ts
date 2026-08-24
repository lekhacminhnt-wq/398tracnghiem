import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-session";
import { getUserDetailRows } from "@/lib/admin-report";

function csvEscape(v: string | number | boolean) {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await getUserDetailRows();
  const header = [
    "Họ tên",
    "Email",
    "Cơ quan",
    "Số điện thoại",
    "Bài đã đạt",
    "Tổng số bài",
    "Đề sát hạch",
    "Trạng thái",
    "Ngày đăng ký",
  ];
  const lines = [header.map(csvEscape).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.fullName,
        r.email,
        r.agency,
        r.phone,
        r.passedLessons,
        r.totalReadyLessons,
        r.examBest,
        r.fullyComplete ? "Hoàn thành" : "Đang học",
        r.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  const csv = "﻿" + lines.join("\r\n"); // BOM để Excel đọc đúng tiếng Việt

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bdhvs-tien-do.csv"`,
    },
  });
}
