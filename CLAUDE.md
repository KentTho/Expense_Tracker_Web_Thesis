# CLAUDE.md — Expense Tracker Web (Thesis Upgrade v2.0)

> File quản trị thực thi cho AI. Đọc file này TRƯỚC khi viết bất kỳ dòng code nào.
> Đây KHÔNG phải report. Nguồn tiến độ dự án: `PROJECT_ROADMAP.md`.

## 1. PROJECT STRUCTURE
- `expense-tracker/` — Frontend React 18 + Vite + Tailwind CSS.
- `expense-tracker-be/` — Backend FastAPI + SQLAlchemy + Alembic (PostgreSQL/Neon).
- `image_structure/` — TARGET REFERENCE ONLY (sơ đồ mục tiêu). KHÔNG phải authority của kiến trúc hiện tại; không ép repo giống hình.
- `KetQua-Audit.md` — bằng chứng audit Phase 01 (lịch sử). KHÔNG tự sửa.
- `README_andrej-karpathy-skills.md` — nguồn 4 nguyên tắc. KHÔNG tự sửa.
- `report-in4/` — report/asset người dùng lưu trữ. Protected. Không đẩy lên git.
- `PROJECT_ROADMAP.md` — bản đồ tiến độ dự án theo từng Phase/Wave.

## 2. EXECUTION PRINCIPLES (Andrej Karpathy)
- **Think Before Coding** — không đoán; nêu assumption; surface tradeoff; hỏi khi mâu thuẫn.
- **Simplicity First** — code tối thiểu giải quyết đúng vấn đề; không abstraction cho code dùng-một-lần.
- **Surgical Changes** — chỉ đụng file trong scope; không format/refactor liền kề; dead code chỉ ghi nhận.
- **Goal-Driven Execution** — mỗi task = tiêu chí verify rõ ràng; loop tới khi PASS.

## 3. NAMING RULES
Python:
- `snake_case` cho variable/function/module.
- `PascalCase` cho class / Pydantic model / ORM model.
- `UPPER_SNAKE_CASE` cho constant.

JavaScript/React:
- `camelCase` cho variable/function.
- `PascalCase` cho component.
- `useXxx` cho custom hook.
- **FILE EXTENSION CONVENTION (canonical):**
  - Module React chứa JSX (pages / components / layouts) → `.jsx`.
  - Module JavaScript không chứa JSX (services / api / utils / config / data) → `.js`.
- KHÔNG để tồn tại song song `X.js` và `X.jsx` cho cùng một module (import không đuôi sẽ bị Vite resolve nhầm `.js` trước `.jsx`). Một module = một file = một đuôi đúng convention.
- Hậu tố `Unified` KHÔNG phải khái niệm kiến trúc lâu dài; nếu bản `Unified` là bản active đúng thì đổi về tên canonical.

## 4. ARCHITECTURE RULES
Backend (Layered Pragmatic Monolith — GIỮ NGUYÊN):
- `routes/` = HTTP boundary (controller responsibility).
- `services/` = workflow/business logic khi cần.
- `cruds/` = data access hiện tại (GIỮ tên; không đổi thành `repositories/`).
- `models/` = ORM entity.
- `schemas/` = request/response validation (Pydantic).
- `db/` = engine/session (GIỮ tên; không đổi thành `database/`).
- KHÔNG cho route gọi ORM session trực tiếp.
- KHÔNG đổi folder chỉ để giống reference image.
- KHÔNG áp Full Clean Architecture (không tạo `domain/application/infrastructure/presentation`).

Frontend:
- Mọi API call đi qua canonical API client (`src/services/api.js`).
- Component KHÔNG hardcode API origin (dùng `VITE_API_URL`).
- KHÔNG nhân đôi auth/logout logic.
- KHÔNG tạo global state khi local state đủ dùng.

## 5. SECURITY RULES
- KHÔNG in hoặc commit secret.
- KHÔNG đọc raw giá trị trong `.env`.
- KHÔNG trả `str(e)` / stack trace ra client.
- KHÔNG hardcode credential theo môi trường.
- KHÔNG chạy migration trên DB target/production khi chưa được phê duyệt.

## 6. CHANGE RULES
- Exact scope only theo Wave đang chạy.
- KHÔNG broad format toàn repo.
- KHÔNG drive-by refactor.
- KHÔNG xóa suspected dead code nếu chưa có reference proof.
- KHÔNG commit / push / deploy khi chưa được yêu cầu.

## 7. VALIDATION COMMANDS
Đã xác minh chạy được:
- Frontend build: `cd expense-tracker && npm run build`
- Frontend lint:  `cd expense-tracker && npm run lint`
- Frontend dev:   `cd expense-tracker && npm run dev`
- Frontend test:  `cd expense-tracker && npm test -- --run` (vitest)
- Backend test:   `cd expense-tracker-be && .venv/Scripts/python -m pytest`
  - DB-suite (MIG/DAT/F7) chỉ chạy khi có `TEST_DATABASE_URL` trỏ Postgres **local test** (guard chặn Neon/production); thiếu env → skip an toàn, KHÔNG fallback SQLite.

## 8. OUTPUT RULE
- Trả kết quả ngắn gọn nhưng đủ evidence (dùng `path:line`).
- KHÔNG tạo report folder / report `.md` (trừ `CLAUDE.md`, `PROJECT_ROADMAP.md`, và tài liệu kiến trúc lâu dài trong `docs/architecture/**`).
- KHÔNG tuyên bố "production-ready" / "DONE 100%" khi chỉ kiểm tra local.

## 9. SOFTWARE AUTHORITIES (one concern → one authority)
Quyết định của Human Operator. Trạng thái: CURRENT (đang dùng) / TARGET (đích, chưa verify) / DEFERRED.

| Concern | Authority | Trạng thái |
|---|---|---|
| Source control (SCM) | **GitHub** (single canonical) | CURRENT |
| CI | **GitHub Actions** (single canonical) | CURRENT |
| Frontend stack | React 18 + Vite + Tailwind | CURRENT |
| Frontend host | Vercel | TARGET |
| Backend stack | FastAPI + Pydantic + SQLAlchemy 2 + Alembic | CURRENT |
| Backend runtime | **Python 3.12** | CURRENT (verified: clean-build `python:3.12-slim` + `pip check` + full pytest qua Docker) |
| Backend host | Render (Docker Web Service) | TARGET |
| Database | PostgreSQL / Neon | CURRENT (local test) · Neon = TARGET/PRODUCTION_GATED |
| Cache / rate-limit store | Redis-compatible; prod = Render Key Value / Valkey. In-memory chỉ là fallback LOCAL/DEGRADED | TARGET |
| Container | Docker / Docker Compose (dev + CI reproducibility) | CURRENT |
| DNS | Cloudflare (Vercel record DNS-only; Render API record proxy/WAF candidate) | TARGET |
| Auth | Firebase + Backend JWT (KHÔNG thêm session/token_version giai đoạn này) | CURRENT |

Quy tắc: GitLab CI đã gỡ; KHÔNG dùng lại. KHÔNG đặt Cloudflare proxy trước frontend Vercel.

Tài liệu kiến trúc canonical: [`docs/architecture/CODEBASE_MAP.md`](docs/architecture/CODEBASE_MAP.md) · [`docs/architecture/STACK_AND_DEPLOYMENT.md`](docs/architecture/STACK_AND_DEPLOYMENT.md).
