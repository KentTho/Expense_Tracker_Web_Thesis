# STACK & DEPLOYMENT — Expense Tracker Web v2.0

> Tài liệu kiến trúc lâu dài. Nhãn trạng thái:
> **CURRENT** (đang chạy) · **VERIFIED_LOCAL** (đã chứng minh bằng test/Docker local) ·
> **VERIFIED_EXTERNAL** (đã verify trên môi trường triển khai thật) · **TARGET** (đích, chưa triển khai) ·
> **EXTERNAL_GATE** (chờ Human cấu hình dịch vụ ngoài: Render/Vercel/Firebase/Neon) ·
> **PRODUCTION_GATED** (chỉ làm sau Human Gate). Một concern → một authority.

## 1. Software authorities
| Concern | Authority | Trạng thái |
|---|---|---|
| Source control | **GitHub** (single canonical) | CURRENT |
| CI | **GitHub Actions** (`.github/workflows/ci.yml`) | CURRENT · REMOTE_CI_VERIFIED (Backend/Frontend/Docker PASS trên PR + main) |
| Frontend stack | React 18 + Vite 5 + Tailwind 3 | CURRENT |
| Frontend host | Vercel (`expense-tracker-web-thesis.vercel.app`) | CURRENT_DEPLOYMENT_REACHABLE (GET 200) · auth/BE integration NOT_YET_FULLY_VERIFIED |
| Backend stack | FastAPI + Pydantic + SQLAlchemy 2 + Alembic | CURRENT |
| Backend runtime | **Python 3.12** (CURRENT, verified qua Docker) | xem §4 |
| Backend host | Render (Docker Web Service) | TARGET |
| Database | PostgreSQL 17.6 local (test) | CURRENT · Neon = TARGET / PRODUCTION_GATED |
| Cache / rate-limit store | Redis-compatible; prod = Render Key Value / Valkey | TARGET (in-memory fallback chỉ LOCAL/DEGRADED) |
| Container | Docker / Docker Compose | CURRENT (config + image build verified local trên `python:3.12-slim`) |
| DNS | Cloudflare | TARGET |
| Auth | Firebase + Backend JWT | CURRENT (không thêm session/token_version giai đoạn này) |

## 2. Database connection policy
> Cơ chế chọn URL đã IMPLEMENTED trong code (VERIFIED_LOCAL). Việc gán URL Neon
> pooled/direct trên Render vẫn là EXTERNAL_GATE / PRODUCTION_GATED.

- **Authority chọn URL migration** = `db/migration_url.py::resolve_migration_url`, Alembic gọi
  qua `alembic/env.py`. Precedence:
  1. `TEST_DATABASE_URL` — chỉ local/CI test, đi qua NO_TARGET_GUARD (host local + tên DB chứa `test`; chặn neon/render/railway/supabase/prod/amazonaws). [VERIFIED_LOCAL]
  2. `DATABASE_MIGRATION_URL` — kết nối migration canonical (**direct / non-pooled**). [EXTERNAL_GATE khi gán URL Neon]
  3. `DATABASE_URL` — fallback runtime khi chưa cấu hình URL migration riêng.
- Application runtime (`db/database.py`) → luôn dùng `DATABASE_URL` (**pooled** trên Neon).
- Lý do tách direct-migration: chạy DDL qua endpoint POOLED (pgbouncer transaction mode) có thể
  lỗi/không ổn định → migration nên đi DIRECT.
- Đã chứng minh: `tests/db/test_migration_url_authority.py` (8, offline) + full PG-backed suite +
  Docker container startup `alembic upgrade head` chạy qua resolver. [VERIFIED_LOCAL]
- KHÔNG kết nối/migrate/stamp Neon khi chưa có Human Gate.

## 3. Migration adoption
- **New install**: `alembic upgrade head` dựng baseline `a1b2c3d4e5f6` (7 bảng) từ zero → NEW_INSTALL_SAFE.
- **Existing DB (Neon)**: EXISTING_DB_RECONCILIATION_REQUIRED + PRODUCTION_GATED. Trước khi `alembic stamp a1b2c3d4e5f6` phải so schema đầy đủ (column/type/nullable/default/PK/FK/unique/index/cascade/timezone) trên clone + backup. "Trùng 7 tên bảng" KHÔNG đủ để stamp.

## 4. Python 3.12 (CURRENT, đã verify)
- Python 3.10 gần EOL → đã nâng canonical lên **3.12** (`python:3.12-slim`).
- **Đã chứng minh** bằng clean-build Docker: install `requirements.txt`+`requirements-dev.txt` trên `python:3.12-slim` → `pip check` = *No broken requirements found* → full PostgreSQL-backed pytest **22 passed** (Postgres 17.6 disposable) → offline pytest **6 passed / 16 skipped** → import smoke `main` (61 routes) + `alembic` OK. Runtime báo `Python 3.12.14`.
- **0 dependency phải đổi** để tương thích 3.12 (không có gói nào breaking). Nếu tương lai cần nâng: từng gói một, ghi lý do, KHÔNG nhảy 3.13/3.14 khi chưa verify.
- CI + Dockerfile + `runtime.txt` đều để `3.12`.

## 5. Edge / DNS policy (TARGET)
- Vercel frontend record → Cloudflare **DNS-only**.
- Render API record → Cloudflare **proxy/WAF** candidate.
- KHÔNG đặt Cloudflare proxy trước frontend Vercel.

## 6. CI pipeline hiện tại (`.github/workflows/ci.yml`)
- **backend**: service PostgreSQL 17.6 + Redis, Python 3.12, cài requirements(+dev), `alembic upgrade head`, `pytest`.
- **frontend**: Node 22, `npm ci`, `vitest --run`, `vite build`.
- **docker**: `docker build ./expense-tracker-be`.
- Secrets: KHÔNG nhúng; dùng GitHub Actions secrets khi thêm CD.

## 7. Wave 04 (PRODUCTION_GATED — chưa làm)
GitHub branch protection + remote CI verify · Vercel FE deploy · Render BE Docker deploy ·
Render Key Value/Valkey · Neon branch-based migration rehearsal · pooled vs direct connection ·
Cloudflare DNS + WAF · structured logging + Sentry · backup/rollback runbook ·
production smoke. **Không migration production nếu chưa có Human Gate.**

## 8. Integration contract (Wave 04A0 — CURRENT, verify local)

### 8.1 API base URL authority — FAIL-CLOSED (cập nhật Wave04A2)
- `VITE_API_URL` = **ORIGIN ONLY** (vd `https://api.example.com`): protocol `https:`, có hostname,
  KHÔNG userinfo, pathname `/` hoặc rỗng, KHÔNG query, KHÔNG fragment, KHÔNG trailing slash.
  Mọi route được ghép trong `expense-tracker/src/services/api.js` (`resolveUrl`).
- **Một validator authority** = `src/services/apiUrl.js::validateApiOrigin(raw,{allowLocalhost})`
  (dựa trên URL semantics, KHÔNG regex mảnh). Dùng chung bởi cả runtime (`api.js`) và build guard
  (`vite.config.ts`) — không nhân đôi logic.
  - **DEV** (`resolveBackendBase` isDev): thiếu biến → `http://localhost:8000`; origin sai → cảnh báo (không chặn).
  - **PRODUCTION/optimized build**: thiếu/không hợp lệ → **THROW**. localhost chỉ hợp lệ ở mode `development`/`test`.
- Tầng chặn build `vite.config.ts`: validate với **MỌI** `command === "build"` (không chỉ mode production —
  đóng Gap A: `vite build --mode staging` không còn bypass). URL có path (`/api`,`/auth`,`/v1`…)/query/fragment/
  non-HTTPS → build FAIL (Gap B). CI cấp origin non-secret `https://backend.example.com`.
- Đã chứng minh [VERIFIED_LOCAL]: 10 test `apiUrl.test.jsx` (APIURL-01..09) + `resolveBackendBase` trong
  `apiClient.test.jsx`; build staging thiếu biến → exit 1; build `/v1`/query → exit 1; https origin hợp lệ → build OK.
- Backend KHÔNG có prefix `/api`; router prefix = `/auth`, `/dashboard`, `/expenses`, …
- **Root cause Wave04A1 (RC-1)**: trước đây thiếu `VITE_API_URL` ở production → bundle âm thầm gọi
  `http://localhost:8000` → `/auth/sync` không bao giờ tới Render → không có row Neon. Fail-closed chặn tái diễn.

### 8.2 CORS policy
- Nguồn: `BACKEND_CORS_ORIGINS` (CSV hoặc JSON list) → `core/config.py::cors_origins`
  (đã **loại bỏ `*`**; rỗng → default localhost dev).
- `allow_credentials=True` + **không bao giờ** dùng `*` (đã chứng minh: origin lạ không
  được cấp `access-control-allow-origin`; origin Vercel được echo chính xác).
- Local dev: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`.
- Production: set `BACKEND_CORS_ORIGINS` = origin Vercel chính thức (exact). Preview domain
  động (nếu cần) → mở rộng nhỏ nhất có kiểm soát, có tài liệu.

### 8.3 Health & readiness
- `GET /health` → liveness (không chạm dependency).
- `GET /ready` → DB **BẮT BUỘC** (SELECT 1; down → 503); Redis **OPTIONAL/DEGRADED**
  (down → `"degraded"`, không chặn readiness). Không lộ credential/URL/stack trace.

### 8.4 Environment matrix (audit — KHÔNG chứa secret thật)
| Biến | Chủ | FE/BE | Local | CI | Vercel | Render | Neon | Secret? | Required? |
|---|---|---|---|---|---|---|---|---|---|
| `VITE_API_URL` | FE build | FE | `.env` (origin-only) | — | ✅ set | — | — | Không | Có (prod) |
| `SECRET_KEY` | BE | BE | `.env` | CI env | — | ✅ set | — | **Có** | Có |
| `DATABASE_URL` (runtime, pooled) | BE | BE | local PG | CI PG | — | ✅ set | pooled | **Có** | Có |
| `DATABASE_MIGRATION_URL` (direct) | BE | BE | local PG | — | — | ✅ set | direct | **Có** | Có (khi migrate) |
| `TEST_DATABASE_URL` | BE test | BE | local PG (tên chứa `test`) | CI PG | — | — | ❌ cấm | **Có** | Test-only |
| `BACKEND_CORS_ORIGINS` | BE | BE | default | default | — | ✅ set (Vercel origin) | — | Không | Có (prod) |
| `REDIS_URL` | BE | BE | optional | CI redis | — | Key Value | — | **Có** | Optional/degraded |
| `FIREBASE_SERVICE_ACCOUNT` | BE | BE | optional | — | — | ✅ set (JSON) | — | **Có** | Có (auth) |
| `GOOGLE_API_KEY`/`GEMINI_API_KEY` | BE | BE | optional | — | — | set (chat) | — | **Có** | Optional (chat) |
| Firebase web config (`firebase.jsx`) | FE | FE | in-repo | in-repo | in-repo | — | — | Không* | Có |

\* Firebase **Web** config (apiKey/authDomain/projectId) KHÔNG phải service-account secret
(là identifier công khai phía client). Service account (`FIREBASE_SERVICE_ACCOUNT`) MỚI là secret.

Tách bạch: **RUNTIME** (pooled) ≠ **MIGRATION** (direct) ≠ **TEST** (`TEST_DATABASE_URL`,
localhost, tên chứa `test`, guard chặn Neon/Render/…). KHÔNG đặt secret vào repo.

### 8.5 Firebase deployment checklist (HUMAN — EXTERNAL_GATE)
Firebase Console → Authentication → Settings → **Authorized Domains** phải chứa:
- `expense-tracker-web-thesis.vercel.app` (Vercel production hiện tại)
- domain frontend tuỳ chỉnh (khi có)
- `localhost` (dev — Firebase đã có sẵn mặc định)

Project hiện tại: `expense-tracker-2200006616` (authDomain `…firebaseapp.com`). Nếu browser
báo `auth/unauthorized-domain` → thiếu domain trong danh sách trên. **KHÔNG** đổi Firebase
Console khi chưa có Human approval. Real signup/login E2E = **EXTERNAL_FIREBASE_E2E_GATE**
(Wave 04A1, dùng project test non-production + tài khoản disposable).

Init Firebase Admin (server) = inline ở `main.py:48-63`, chỉ đọc ENV `FIREBASE_SERVICE_ACCOUNT`
(KHÔNG dùng file `firebase_admin_init.py` — file đó UNUSED_RUNTIME). Thiếu ENV trên Render →
`firebase_admin._apps` rỗng → `/auth/sync` verify token THROW → không tạo row Neon (RC-2 external).

## 9. Storage authority matrix (Gate 8 — Wave04A1)
Một loại dữ liệu → một authority. KHÔNG chuyển bảng quan hệ sang Cloudflare KV/D1.

| DATA_CLASS | AUTHORITY | RETENTION | CONSISTENCY | BACKUP | PII? | SECRET? | WHY |
|---|---|---|---|---|---|---|---|
| Identity/password/provider | **Firebase Auth** | Tới khi xoá user | Firebase | Firebase-managed | Có (email) | Token=secret | Firebase là identity authority; app không giữ password |
| users, transactions, categories, audit_logs, system_settings | **Neon PostgreSQL** | Bền vững | Strong (ACID) | Neon PITR/branch (PRODUCTION_GATED) | Có | DSN=secret | Core relational source of truth |
| Cache + distributed rate-limit | **Render Key Value / Valkey** | Ephemeral (TTL) | Best-effort | Không cần | Không | `REDIS_URL`=secret | Chia sẻ state khi multi-instance; down → degraded |
| Client session (idToken/user) | **Browser localStorage/sessionStorage** | Phiên | Client-only | Không | Có (nhẹ) | Chứa JWT | Session tạm phía client; authority ghi = `authService.saveSession` |
| Frontend build/static | **Vercel** | Theo deploy | — | Vercel | Không | Không | Hosting/CDN FE |
| Backend compute | **Render** (Docker Web Service) | Theo deploy | — | — | — | ENV=secret | Backend runtime |
| DNS + API WAF | **Cloudflare** (sau khi origin ổn) | — | — | — | Không | Không | DNS-only cho Vercel; proxy/WAF cho API domain |
| File/blob (avatar, receipt, export) | **Cloudflare R2** — CHỈ nếu có nhu cầu thật | — | — | — | Có thể | Key=secret | **Hiện KHÔNG dùng**: profile_image lưu string/URL trong Neon, chưa có upload file bền vững → KHÔNG thêm R2 |

Quyết định R2/D1/KV: **KHÔNG thêm** trong phase này (không có nhu cầu lưu file/blob bền vững đã chứng minh).

## 10. Wave04A1 — first broken boundary & external gate checklist
Triệu chứng: web reachable, signup/login lỗi, account KHÔNG xuất hiện ở Neon. Đây là
**distributed integration failure** (không phải Neon hỏng). Backend `sync_firebase_user`
tự nó commit đúng (chứng minh bằng PG-backed suite) → break nằm ở wiring/config:

- **RC-1 (P0, đã FIX trong code)**: FE production thiếu `VITE_API_URL` → gọi nhầm localhost. Fail-closed §8.1.
- **RC-2 (P0, EXTERNAL_GATE)**: Render ENV. Phải set: `SECRET_KEY`, `DATABASE_URL` (Neon pooled),
  `DATABASE_MIGRATION_URL` (Neon direct), `BACKEND_CORS_ORIGINS` = origin Vercel, `FIREBASE_SERVICE_ACCOUNT` (JSON).
  Thiếu bất kỳ → `/auth/sync` fail → không có row Neon.
- **RC-3 (P1, giảm thiểu trong code)**: migration DDL nên đi `DATABASE_MIGRATION_URL` (direct), §2.
- **Vercel**: set `VITE_API_URL` = origin Render (origin-only https). Đây là bản vá thực tế cho RC-1.
- **Firebase**: Authorized Domains chứa host Vercel (§8.5).

Khi 5 mục external trên xong → real browser E2E (EXTERNAL_FIREBASE_E2E_GATE) mới verify được đầu-cuối.

## 11. Wave04A2 — review-gap closure & secret quarantine (VERIFIED_LOCAL)
- **PR #3 review gaps đã đóng** (§8.1): Gap A (build guard chỉ chạy mode=production → nay validate MỌI
  optimized build); Gap B (chỉ chặn `/api`,`/auth` → nay URL-semantics origin-only qua `validateApiOrigin`).
- **Secret quarantine**: Firebase service-account JSON đặt local dưới backend. `.gitignore` mở rộng
  `serviceAccountKey*.json` để phủ cả `serviceAccountKey.json` (mới) và `serviceAccountKey_old.json` (cũ).
  Đã kiểm (metadata-only, KHÔNG mở nội dung): cả 2 file **ignored + không tracked + chưa từng commit**.
  KHUYẾN NGHỊ: sau khi Render `FIREBASE_SERVICE_ACCOUNT` đã hoạt động, xoá/di chuyển JSON local khỏi cây repo.
- **External runtime trust chain (Render/Neon/Firebase E2E)**: chưa verify — cần `RENDER_BACKEND_URL` thật
  (chưa được cung cấp) + tài khoản disposable + duyệt Playwright. Trạng thái: EXTERNAL_GATE (pending Human).
