# 398tracnghiem — Bình dân học vụ số · Sát hạch trực tuyến

Website thi trắc nghiệm theo cơ chế tổ chức kiểm tra, sát hạch quy định tại **Phụ lục 3** và
**Phụ lục 4** kèm theo Nghị quyết số 398/NQ-UBTVQH16 ngày 08/8/2026 của Ủy ban Thường vụ Quốc hội.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Prisma 7 (Postgres) + Google
Sheets API (đồng bộ báo cáo, tuỳ chọn).

## Tình trạng dữ liệu ngân hàng câu hỏi

- **Đầy đủ, đã xác minh:** Toàn bộ 26 chuyên đề (136 bài, 681 câu — Bài 4 Chuyên đề 16 có 6 câu
  thay vì 5, đúng theo PDF gốc) + đề sát hạch chính thức Phần II (50 câu). Toàn bộ trích và xử lý
  từ file PDF Phụ lục 3 gốc: nội dung câu hỏi, phương án, đáp án đúng và phần giải thích (đoạn in
  nghiêng sau mỗi câu) đối chiếu trực tiếp với PDF, không suy luận. Mỗi câu có trường `source` trong
  `data/questions/*.json`:
  - `"explicit-letter"` — đáp án được nêu rõ ký hiệu trong PDF gốc (toàn bộ đề sát hạch Phần II, và
    một phần Chuyên đề 1–16).
  - `"manually-verified"` — đã đọc và xác minh thủ công (Chuyên đề 1–7).
  - `"bold-verified"` — đối chiếu tự động bằng font-name (in đậm = đáp án đúng) trên toàn bộ PDF,
    độ tin cậy tương đương `explicit-letter` (dùng cho phần còn lại của Chuyên đề 1–7, và toàn bộ
    Chuyên đề 8–26 khi PDF không nêu rõ ký hiệu chữ).
  - `"inferred-from-explanation"` — chỉ còn sót lại ở một phần nhỏ Chuyên đề 1–7 (đã đối chiếu chéo
    bằng in đậm, không cần rà soát lại).
  - 18 câu (6 câu Chuyên đề 7 dạng Đúng/Sai chỉ có 2 phương án; 12 câu đầu bài của Chuyên đề 22/23/24
    chỉ có 3 phương án A/B/C) đúng theo PDF gốc, không phải lỗi trích xuất — xem `isTrueFalse` và số
    lượng khoá trong `options`.
- **Đề sát hạch chính thức:** `examSetId = "official"` (`lib/exam.ts`), 50 câu theo đúng ma trận
  Phụ lục 3 (35 câu cơ bản + 15 câu trung cấp, phân bổ đều 26 chuyên đề). File `demo-exam.json` cũ
  (20 câu thử nghiệm) không còn được seed, giữ lại trên đĩa chỉ để tham khảo lịch sử.

## Nạp thêm/ sửa dữ liệu chuyên đề

1. Chuẩn hoá câu hỏi theo cấu trúc trong `data/questions/chuyen-de-01.json` (mảng `lessons`, mỗi
   bài có `lessonOrder`, `lessonTitle`, `questions` với `options`, `correctLabel`, `explanation`).
2. Cập nhật `status`/`title` tương ứng trong `data/topics.json`.
3. `READY_TOPICS` trong `prisma/seed.ts` seed toàn bộ 26 chuyên đề — không cần sửa khi thêm/sửa dữ
   liệu một chuyên đề đã có trong danh sách.
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
