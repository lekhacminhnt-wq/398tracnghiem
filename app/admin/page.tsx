import { redirect } from "next/navigation";
import { isAdmin, createAdminSession, checkAdminPassword } from "@/lib/admin-session";
import { getUserDetailRows, summarizeByAgency } from "@/lib/admin-report";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") || "");
  if (checkAdminPassword(password)) {
    await createAdminSession();
    redirect("/admin");
  }
  redirect("/admin?error=1");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await isAdmin();
  const { error } = await searchParams;

  if (!admin) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-4 text-2xl font-bold text-brand-primary">Đăng nhập quản trị</h1>
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            Sai mật khẩu quản trị.
          </div>
        )}
        <form action={login} className="space-y-4">
          <input
            required
            name="password"
            type="password"
            placeholder="Mật khẩu quản trị"
            className="w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 outline-none focus:ring-2 focus:ring-brand-ring"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-brand-primary px-4 py-2.5 font-semibold text-white hover:bg-brand-primary-dark cursor-pointer"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  const rows = await getUserDetailRows();
  const summary = summarizeByAgency(rows);
  const totalUsers = rows.length;
  const totalCompleted = rows.filter((r) => r.fullyComplete).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-primary">Quản trị — Tổng hợp tiến độ</h1>
        <a
          href="/api/admin/export"
          className="rounded-md border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-primary-soft"
        >
          Xuất CSV
        </a>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <div className="text-2xl font-extrabold text-brand-primary">{totalUsers}</div>
          <div className="text-sm text-brand-text-muted">người đã đăng ký</div>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <div className="text-2xl font-extrabold text-brand-primary">{totalCompleted}</div>
          <div className="text-sm text-brand-text-muted">đã hoàn thành chương trình</div>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-brand-text">Theo cơ quan (mẫu Phụ lục 5.2)</h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-brand-border bg-brand-surface shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-brand-primary-soft text-brand-text">
            <tr>
              <Th>STT</Th>
              <Th>Cơ quan</Th>
              <Th>Số người học</Th>
              <Th>Số hoàn thành</Th>
              <Th>Tỷ lệ hoàn thành</Th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s, i) => (
              <tr key={s.agency} className="border-t border-brand-border">
                <Td>{i + 1}</Td>
                <Td>{s.agency}</Td>
                <Td>{s.total}</Td>
                <Td>{s.completed}</Td>
                <Td>{s.total ? Math.round((s.completed / s.total) * 100) : 0}%</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-brand-text">Chi tiết từng người học</h2>
      <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-surface shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-brand-primary-soft text-brand-text">
            <tr>
              <Th>Họ tên</Th>
              <Th>Email</Th>
              <Th>Cơ quan</Th>
              <Th>SĐT</Th>
              <Th>Bài đã đạt</Th>
              <Th>Đề sát hạch</Th>
              <Th>Trạng thái</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-brand-border">
                <Td>{r.fullName}</Td>
                <Td>{r.email}</Td>
                <Td>{r.agency}</Td>
                <Td>{r.phone}</Td>
                <Td>
                  {r.passedLessons}/{r.totalReadyLessons}
                </Td>
                <Td>{r.examBest}</Td>
                <Td>
                  {r.fullyComplete ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                      Hoàn thành
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                      Đang học
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-brand-text">{children}</td>;
}
