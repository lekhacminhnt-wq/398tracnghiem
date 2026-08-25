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
  const next = String(formData.get("next") || "/");

  if (!email) {
    redirect(`/dang-ky?error=missing&next=${encodeURIComponent(next)}`);
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    redirect(`/dang-ky?error=email&next=${encodeURIComponent(next)}`);
  }

  // Chỉ ghi đè các trường được điền ở lượt này — tránh xoá mất họ tên/cơ quan/SĐT đã lưu
  // trước đó khi người dùng quay lại chỉ nhập email để tiếp tục tiến trình.
  const update: { fullName?: string; agency?: string; phone?: string } = {};
  if (fullName) update.fullName = fullName;
  if (agency) update.agency = agency;
  if (phone) update.phone = phone;

  const user = await prisma.user.upsert({
    where: { email },
    update,
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
  const nextPath = next || "/";

  if (session) {
    redirect(nextPath);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-brand-primary">Đăng ký / Vào thi</h1>
      <p className="mb-6 text-sm text-brand-text-muted">
        Chỉ <strong>email</strong> là bắt buộc — dùng làm định danh duy nhất để lưu và tiếp tục
        đúng tiến trình học của bạn giữa các lượt truy cập, không cần mật khẩu. Các thông tin còn
        lại không bắt buộc.
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error === "email"
            ? "Email chưa đúng định dạng, vui lòng kiểm tra lại."
            : "Vui lòng nhập email để tiếp tục."}
        </div>
      )}

      <form action={register} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <Field label="Email" name="email" type="email" placeholder="ten@coquan.gov.vn" required />
        <Field label="Họ và tên" name="fullName" placeholder="Nguyễn Văn A" />
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
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-text">
        {label}
        {required ? (
          <span className="text-brand-primary"> *</span>
        ) : (
          <span className="text-brand-text-muted"> (tuỳ chọn)</span>
        )}
      </span>
      <input
        required={required}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-brand-text outline-none focus:ring-2 focus:ring-brand-ring"
      />
    </label>
  );
}
