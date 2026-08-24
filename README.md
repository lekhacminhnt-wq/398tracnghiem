# 398tracnghiem — Bình dân học vụ số · Sát hạch trực tuyến

Website thi trắc nghiệm theo cơ chế tổ chức kiểm tra, sát hạch quy định tại **Phụ lục 3** và
**Phụ lục 4** kèm theo Nghị quyết số 398/NQ-UBTVQH16 ngày 08/8/2026 của Ủy ban Thường vụ Quốc hội.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Prisma 7 (Postgres) + Google
Sheets API (đồng bộ báo cáo, tuỳ chọn).

## Tình trạng dữ liệu ngân hàng câu hỏi

- **Đầy đủ, đã xác minh:** Chuyên đề 1–7 (37 bài, 185 câu), trích và xử lý từ file PDF Phụ lục 3.
  Vì PDF gốc không đánh dấu ký hiệu đáp án đúng tường minh, phần lớn đáp án đúng được xác định
  bằng cách đọc và đối chiếu nội dung giải thích với 4 phương án — mỗi câu có trường `source`
  trong `data/questions/*.json`:
  - `"explicit-letter"` — đáp án được nêu rõ ký hiệu trong PDF gốc, độ tin cậy cao nhất.
  - `"manually-verified"` — đã đọc và xác minh thủ công (56/185 câu).
  - `"inferred-from-explanation"` — suy luận tự động qua đối chiếu từ khoá với đoạn giải thích,
    **nên rà soát lại** trước khi dùng cho kỳ thi chính thức.
- **Chưa có dữ liệu:** Chuyên đề 8–26 (99 bài) và đề sát hạch chính thức (Phần II, 50 câu) —
  hiển thị "Sắp cập nhật" trên giao diện.
- **Đề sát hạch hiện tại là đề thử nghiệm** (`examSetId = "demo"`, 20 câu lấy từ 7 chuyên đề đã
  có) để kiểm thử cơ chế 90 phút/ngẫu nhiên/tự nộp. Khi có đủ 50 câu Phần II chính thức, cập nhật
  `EXAM_SET_ID` trong `lib/exam.ts` thành `"official"` và chạy lại `npm run seed` với dữ liệu mới.

## Nạp thêm dữ liệu chuyên đề

1. Chuẩn hoá câu hỏi mới theo cấu trúc trong `data/questions/chuyen-de-01.json` (mảng `lessons`,
   mỗi bài có `lessonOrder`, `lessonTitle`, `questions` gồm 5 câu với `options`, `correctLabel`,
   `explanation`).
2. Cập nhật `status` tương ứng trong `data/topics.json` từ `"PENDING"` sang `"READY"`.
3. Thêm chuyên đề vào mảng `READY_TOPICS` trong `prisma/seed.ts`.
4. Chạy `npm run seed` (script tự xoá và nạp lại toàn bộ câu hỏi — không ảnh hưởng dữ liệu người
   dùng/kết quả làm bài).

## Biến môi trường (`.env`, không commit)

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Có | Chuỗi kết nối Postgres |
| `SESSION_SECRET` | Có | Chuỗi ngẫu nhiên dài để ký cookie phiên đăng nhập/quản trị |
| `ADMIN_PASSWORD` | Có | Mật khẩu vào trang `/admin` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Không | Bật đồng bộ Google Sheet — xem hướng dẫn bên dưới |
| `GOOGLE_PRIVATE_KEY` | Không | Đi kèm service account ở trên |
| `GOOGLE_SHEET_ID` | Không | ID của Google Sheet (phần giữa `/d/` và `/edit` trên URL) |

Thiếu 3 biến Google ở trên thì tính năng đồng bộ Sheet tự động bỏ qua (không lỗi), dữ liệu vẫn lưu
đầy đủ trong Postgres.

### Bật đồng bộ Google Sheet

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project → bật **Google
   Sheets API**.
2. Tạo **Service Account** → tạo khoá JSON, lấy `client_email` và `private_key`.
3. Mở Google Sheet đích → **Share** → thêm `client_email` ở trên với quyền **Editor**.
4. Tạo 2 tab trong Sheet: `Đăng ký` (log từng lượt đăng ký) và `Tổng hợp` (bảng tổng hợp tiến độ,
   tự ghi đè mỗi khi có người nộp bài).
5. Điền `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (giữ nguyên `\n`), `GOOGLE_SHEET_ID`.

## Phát triển local

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

## Phạm vi

Trang này tập trung vào cơ chế thi/sát hạch theo Phụ lục 3, 4. Không bao gồm các hạng mục thuộc
nền tảng LMS quốc gia đầy đủ mô tả tại Phụ lục 7 (app di động, trợ lý AI, CMS tin tức, phân quyền
nhiều cấp lãnh đạo, chứng nhận có mã QR liên kết định danh điện tử...).
