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
- **Goal-Driven Execution** — mỗi task = tiêu chí verify rõ ràng.
- **Bounded Repair Law (Permanent)** — Cho một root cause: tối đa 2 chu kỳ sửa chữa (REPRODUCE → RED TEST → ROOT CAUSE → MINIMAL FIX → TARGETED TEST → DOMAIN TEST → FULL REGRESSION → LIVE RETEST). Nếu vẫn fail sau 2 chu kỳ: DỪNG, đánh dấu FAILED/BLOCKED, báo cáo bằng chứng, KHÔNG tự ý mở rộng scope, KHÔNG hạ chuẩn test, KHÔNG định nghĩa lại PASS.
- **Clarification Gate (Evidence-First)** — hỏi Human đúng lúc, KHÔNG tạo ceremony; KHÔNG phải "luôn luôn hỏi trước khi làm":
  1. Tự kiểm chứng bằng Git/source/tests/tool/runtime (READ-ONLY) TRƯỚC.
  2. Chỉ hỏi khi ambiguity còn lại thực sự ảnh hưởng: hành động bất khả nghịch; push/merge/deploy; production/hệ thống ngoài; credential/secret; thao tác DB/data phá hủy; breaking API contract; authority kiến trúc/tool; mở rộng scope lớn; nhiều phương án hợp lệ có trade-off đáng kể.
  3. Nếu repo/tool tự trả lời được → phải tự kiểm, KHÔNG hỏi Human.
  4. Có safe default rõ ràng và reversible → tự tiếp tục và ghi assumption.
  5. KHÔNG hỏi lại quyết định Human đã khóa trong CLAUDE.md hoặc phase hiện tại.
  6. Mục tiêu = đủ độ tin cậy để hành động an toàn, KHÔNG phải thêm thủ tục.

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
- **Credential Handling Law (Permanent)**:
  1. Never embed password/secret/token in shell command literals.
  2. Never log secret values.
  3. Never commit secrets.
  4. Credential exposed in logs/transcript = COMPROMISED → rotate before reuse.
  5. Reports may state secret presence/status, never secret value.

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

## 8. EVIDENCE LAW & VERIFICATION CONTRACT (Permanent)
- **Allowed Evidence Statuses**: `VERIFIED_PASS`, `FAILED`, `BLOCKED`, `NOT_VERIFIED`, `NOT_APPLICABLE`, `CONTRADICTORY`.
- **Environment-Scoped PASS (BẮT BUỘC)**:
  `LOCAL_PASS` · `PG_LOCAL_PASS` · `DOCKER_PASS` · `CI_PASS` · `PREVIEW_PASS` · `PRODUCTION_PASS`.
  - TUYỆT ĐỐI KHÔNG suy diễn PASS môi trường cao hơn từ môi trường thấp hơn (`pytest PASS != production PASS`, `CI PASS != production PASS`, `Preview PASS != production PASS`).
  - Skipped tests KHÔNG PHẢI LÀ PASS. Không có bằng chứng = `NOT_VERIFIED`.
  - Nếu bằng chứng thực tế môi trường production mâu thuẫn với PASS trước đó: lập tức đánh dấu `CONTRADICTORY`.
- **Tiêu chuẩn cấp `PRODUCTION_PASS`**:
  1. Required control/UI element tồn tại thực tế.
  2. Real user action được thực thi (không skip qua `if isVisible`).
  3. Expected request thực tế được gửi đi.
  4. Expected HTTP status trả về (2xx hoặc đúng spec).
  5. Expected DB/readback side effect tồn tại thực sự.
  6. Expected UI state hiển thị đúng.
  7. Browser refresh bảo toàn chính xác dữ liệu/state.
  8. Zero unexpected `pageerror`.
  9. Zero required `requestfailed`.
  10. Zero unexplained 5xx errors.
- **Quy tắc phát ngôn**:
  - KHÔNG BAO GIỜ tuyên bố: "100% bug-free", "hoàn hảo không lỗi", "production-ready tuyệt đối".
  - Câu chữ chuẩn mực cho phép: `0 KNOWN REPRODUCIBLE P0/P1 UNDER THE EXECUTED ACCEPTANCE MATRIX.`
- **Mandatory Source-of-Truth Hierarchy (Permanent)**:
  1. Live runtime evidence
  2. Deployment provenance
  3. Current Git/source
  4. Database readback
  5. Automated tests
  6. Canonical architecture/governance docs
  7. Historical reports
  8. Memory (Memory KHÔNG BAO GIỜ override runtime/source; nếu tài liệu mâu thuẫn live runtime → CONTRADICTORY).
- **Skill Routing Authority (Permanent)**:
  - Root cause: `superpowers/systematic-debugging`
  - TDD: `superpowers/test-driven-development` (không dùng đồng thời skill TDD khác)
  - Verification: `superpowers/verification-before-completion`
  - Code Graph: `CodeGraph MCP`
  - Production browser: `Playwright MCP` + repo Playwright tests
  - PR Review: `requesting-code-review`
  - Branch closeout: `finishing-a-development-branch`
  - CẤM dùng UI redesign / animation skills (Impeccable, Stitch, GSAP) khi functional acceptance chưa green.

## 9. OUTPUT RULE
- Trả kết quả ngắn gọn nhưng đủ evidence (dùng `path:line`).
- KHÔNG tạo report folder / report `.md` (trừ `CLAUDE.md`, `PROJECT_ROADMAP.md`, tài liệu kiến trúc lâu dài trong `docs/architecture/**`, và CANONICAL ACCEPTANCE LEDGER tại `docs/qa/PRODUCTION_ACCEPTANCE_LEDGER.md`).
- KHÔNG tuyên bố "production-ready" / "DONE 100%" khi chỉ kiểm tra local.

## 10. SOFTWARE AUTHORITIES (one concern → one authority)
Quyết định của Human Operator. Trạng thái: CURRENT (đang dùng) / TARGET (đích, chưa verify) / DEFERRED.

| Concern | Authority | Trạng thái |
|---|---|---|
| Source control (SCM) | **GitHub** (single canonical) | CURRENT |
| CI | **GitHub Actions** (single canonical) | CURRENT |
| Frontend stack | React 18 + Vite + Tailwind | CURRENT |
| Frontend host | Vercel (`expense-tracker-web-thesis.vercel.app`) | CURRENT · VERIFIED_EXTERNAL |
| Backend stack | FastAPI + Pydantic + SQLAlchemy 2 + Alembic | CURRENT |
| Backend runtime | **Python 3.12** | CURRENT (verified: clean-build `python:3.12-slim` + `pip check` + full pytest qua Docker) |
| Backend host | Render (`expense-tracker-web-thesis-1.onrender.com`) | CURRENT · VERIFIED_EXTERNAL |
| Database | PostgreSQL / Neon | CURRENT (local test) · Neon = TARGET/PRODUCTION_GATED |
| Cache / rate-limit store | Redis-compatible; prod = Render Key Value / Valkey. In-memory chỉ là fallback LOCAL/DEGRADED | TARGET |
| Container | Docker / Docker Compose (dev + CI reproducibility) | CURRENT |
| DNS | Cloudflare (Vercel record DNS-only; Render API record proxy/WAF candidate) | TARGET |
| Auth | Firebase + Backend JWT (KHÔNG thêm session/token_version giai đoạn này) | CURRENT |

Quy tắc: GitLab CI đã gỡ; KHÔNG dùng lại. KHÔNG đặt Cloudflare proxy trước frontend Vercel.

Tài liệu kiến trúc canonical: [`docs/architecture/CODEBASE_MAP.md`](docs/architecture/CODEBASE_MAP.md) · [`docs/architecture/STACK_AND_DEPLOYMENT.md`](docs/architecture/STACK_AND_DEPLOYMENT.md).
