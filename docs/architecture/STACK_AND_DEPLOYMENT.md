# STACK & DEPLOYMENT — Expense Tracker Web v2.0

> Tài liệu kiến trúc lâu dài. Phân biệt rõ **CURRENT** (đang chạy/đã verify local),
> **TARGET** (đích, chưa triển khai), **NOT_YET_VERIFIED**, **PRODUCTION_GATED**
> (chỉ làm sau Human Gate). Một concern → một authority.

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

## 2. Database connection policy (TARGET)
- Application runtime → **pooled** Neon connection.
- Alembic / schema migration → **direct non-pooled** connection.
- Tests → **isolated `TEST_DATABASE_URL`** (Postgres local, tên chứa `test`; guard chặn Neon/Render/Railway/Supabase/production trong `alembic/env.py`).
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

### 8.1 API base URL authority
- `VITE_API_URL` = **ORIGIN ONLY** (vd `https://api.example.com`), KHÔNG kèm path
  (`/api`, `/auth`) và KHÔNG trailing slash. Mọi route được ghép trong
  `expense-tracker/src/services/api.js` (`resolveUrl`).
- Chuẩn hoá tập trung: `normalizeBackendBase()` strip trailing slash + cảnh báo (DEV)
  nếu phát hiện đuôi path. Dev mặc định (bỏ trống) = `http://localhost:8000`.
- Backend KHÔNG có prefix `/api`; router prefix = `/auth`, `/dashboard`, `/expenses`, …

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
