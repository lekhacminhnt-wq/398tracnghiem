import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, getSession } from "@/lib/session";
import { appendRegistration } from "@/lib/sheets";

async function register(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const agency = String(formData.get("agency") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const next = String(formData.get("next") || "/chuyen-de");

  if (!fullName || !email || !agency || !phone) {
    redirect(`/dang-ky?error=missing&next=${encodeURIComponent(next)}`);
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    redirect(`/dang-ky?error=email&next=${encodeURIComponent(next)}`);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { fullName, agency, phone },
    create: { fullName, email, agency, phone },
  });

  await createSession(user.id);
  after(() => appendRegistration(user));

  redirect(next);
}

export default async function DangKyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const session = await getSession();
  const { error, next } = await searchParams;
  const nextPath = next || "/chuyen-de";

  if (session) {
    redirect(nextPath);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">Đăng ký / Vào thi</h1>
      <p className="mb-6 text-sm text-brand-text-muted">
        Nhập thông tin để bắt đầu học và làm bài trắc nghiệm. Nếu bạn đã đăng ký trước đó, chỉ
        cần nhập lại đúng <strong>email</strong> đã dùng để tiếp tục đúng tiến trình đã lưu — hệ
        thống không dùng mật khẩu.
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error === "email"
            ? "Email chưa đúng định dạng, vui lòng kiểm tra lại."
            : "Vui lòng điền đầy đủ các trường bên dưới."}
        </div>
      )}

      <form action={register} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <Field label="Họ và tên" name="fullName" placeholder="Nguyễn Văn A" />
        <Field label="Email" name="email" type="email" placeholder="ten@coquan.gov.vn" />
        <Field label="Cơ quan / đơn vị" name="agency" placeholder="Sở ..., Phòng ..." />
        <Field label="Số điện thoại" name="phone" type="tel" placeholder="09xxxxxxxx" />

        <button
          type="submit"
          className="w-full rounded-md bg-brand-primary px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark cursor-pointer"
        >
          Đăng ký / Tiếp tục
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-text">{label}</span>
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-brand-text outline-none focus:ring-2 focus:ring-brand-ring"
      />
    </label>
  );
}
