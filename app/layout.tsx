import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import { getSession } from "@/lib/session";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bình dân học vụ số — Sát hạch trực tuyến",
  description:
    "Thi trắc nghiệm theo Phụ lục 3, 4 Nghị quyết 398/NQ-UBTVQH16 — Bộ học liệu đa phương tiện Bình dân học vụ số.",
};

const THEME_INIT = `
try {
  var t = localStorage.getItem('theme');
  document.documentElement.setAttribute('data-theme', t === 'xanh-trang' ? 'xanh-trang' : 'do-vang');
} catch (e) {}
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html lang="vi" data-theme="do-vang" className={`${beVietnam.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        <header className="border-b border-brand-border bg-brand-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-brand-primary">
              <span className="star-accent text-xl" aria-hidden>
                ★
              </span>
              <span className="leading-tight">
                Bình dân học vụ số
                <span className="block text-xs font-normal text-brand-text-muted">
                  Sát hạch trực tuyến · Nghị quyết 398/NQ-UBTVQH16
                </span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              <Link href="/chuyen-de" className="rounded-md px-3 py-1.5 hover:bg-brand-primary-soft">
                Chuyên đề
              </Link>
              <Link href="/de-sat-hach" className="rounded-md px-3 py-1.5 hover:bg-brand-primary-soft">
                Đề sát hạch
              </Link>
              <Link href="/tien-do" className="rounded-md px-3 py-1.5 hover:bg-brand-primary-soft">
                Tiến độ
              </Link>
              {session ? (
                <>
                  <Link href="/tien-do" className="rounded-md px-3 py-1.5 hover:bg-brand-primary-soft">
                    {session.fullName}
                  </Link>
                  <a
                    href="/dang-xuat"
                    className="rounded-md px-3 py-1.5 text-brand-text-muted hover:bg-brand-primary-soft"
                  >
                    Đăng xuất
                  </a>
                </>
              ) : (
                <Link
                  href="/dang-ky"
                  className="rounded-md bg-brand-primary px-3 py-1.5 font-semibold text-white hover:bg-brand-primary-dark"
                >
                  Đăng ký / Vào thi
                </Link>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

        <footer className="border-t border-brand-border bg-brand-surface py-6 text-center text-xs text-brand-text-muted">
          Nền tảng thi trắc nghiệm nội bộ theo Phụ lục 3, 4 — Nghị quyết số 398/NQ-UBTVQH16 ngày
          08/8/2026 của Ủy ban Thường vụ Quốc hội. Không phải nền tảng chính thức của "Bình dân học
          vụ số quốc gia".
        </footer>
      </body>
    </html>
  );
}
