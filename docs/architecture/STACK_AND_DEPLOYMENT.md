# STACK & DEPLOYMENT — Expense Tracker Web v2.0

> Tài liệu kiến trúc lâu dài. Phân biệt rõ **CURRENT** (đang chạy/đã verify local),
> **TARGET** (đích, chưa triển khai), **NOT_YET_VERIFIED**, **PRODUCTION_GATED**
> (chỉ làm sau Human Gate). Một concern → một authority.

## 1. Software authorities
| Concern | Authority | Trạng thái |
|---|---|---|
| Source control | **GitHub** (single canonical) | CURRENT |
| CI | **GitHub Actions** (`.github/workflows/ci.yml`) | CURRENT (local parseable) · remote run NOT_YET_VERIFIED |
| Frontend stack | React 18 + Vite 5 + Tailwind 3 | CURRENT |
| Frontend host | Vercel | TARGET |
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
Cloudflare DNS + WAF · health/readiness · structured logging + Sentry · backup/rollback runbook ·
production smoke. **Không migration production nếu chưa có Human Gate.**
