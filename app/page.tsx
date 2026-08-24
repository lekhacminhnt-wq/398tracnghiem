import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  const ctaHref = session ? "/chuyen-de" : "/dang-ky";

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-brand-border bg-brand-surface p-8 text-center shadow-sm">
        <div className="mb-3 text-3xl star-accent" aria-hidden>
          ★ ★ ★
        </div>
        <h1 className="mb-3 text-3xl font-extrabold text-brand-primary">
          Bình dân học vụ số — Sát hạch trực tuyến
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-brand-text-muted">
          Ôn luyện và làm bài trắc nghiệm theo đúng cơ chế tổ chức kiểm tra, sát hạch quy định tại
          Phụ lục 3, Phụ lục 4 kèm theo Nghị quyết số 398/NQ-UBTVQH16 ngày 08/8/2026 của Ủy ban
          Thường vụ Quốc hội.
        </p>
        <Link
          href={ctaHref}
          className="inline-block rounded-md bg-brand-primary px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark"
        >
          {session ? "Vào học tiếp" : "Đăng ký / Bắt đầu học"}
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <InfoCard title="26 chuyên đề · 136 bài học">
          Mỗi bài học gồm 5 câu hỏi trắc nghiệm (3 câu kiến thức, 2 câu tình huống công vụ). Trả
          lời đúng tối thiểu 70% để hoàn thành bài học và mở bài tiếp theo. Số lần làm lại không
          giới hạn.
        </InfoCard>
        <InfoCard title="Đề sát hạch cuối chương trình">
          50 câu hỏi (35 câu cơ bản, 15 câu trung cấp), làm bài trong 90 phút, hệ thống tự động
          thu bài khi hết giờ. Đạt từ 70% số câu trở lên (35/50 câu) để được công nhận đạt.
        </InfoCard>
        <InfoCard title="Trộn đề ngẫu nhiên">
          Mỗi lượt làm bài, thứ tự câu hỏi và thứ tự các phương án trả lời được xáo trộn tự động,
          hạn chế học thuộc theo vị trí đáp án.
        </InfoCard>
        <InfoCard title="Theo dõi tiến trình">
          Hệ thống chấm điểm tự động, lưu vết mọi lượt làm bài và hiển thị tiến trình học tập cá
          nhân theo thời gian thực.
        </InfoCard>
      </section>

      <section className="rounded-xl border border-brand-border bg-brand-primary-soft p-5 text-sm text-brand-text">
        <strong>Lưu ý về dữ liệu:</strong> Bản triển khai hiện có đầy đủ ngân hàng câu hỏi cho 7/26
        chuyên đề đầu (185 câu, trích từ Phụ lục 3). Các chuyên đề còn lại đang được cập nhật. Đề
        sát hạch hiện là <em>đề thử nghiệm</em> (20 câu lấy từ 7 chuyên đề đã có) để trải nghiệm cơ
        chế làm bài; đề chính thức 50 câu sẽ được cập nhật khi có đủ dữ liệu.
      </section>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <h2 className="mb-2 font-semibold text-brand-primary">{title}</h2>
      <p className="text-sm text-brand-text-muted">{children}</p>
    </div>
  );
}
