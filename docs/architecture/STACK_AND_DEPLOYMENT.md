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
| Backend runtime | Python 3.10 (CURRENT) → **3.12 (TARGET, NOT_YET_VERIFIED)** | xem §4 |
| Backend host | Render (Docker Web Service) | TARGET |
| Database | PostgreSQL 17.6 local (test) | CURRENT · Neon = TARGET / PRODUCTION_GATED |
| Cache / rate-limit store | Redis-compatible; prod = Render Key Value / Valkey | TARGET (in-memory fallback chỉ LOCAL/DEGRADED) |
| Container | Docker / Docker Compose | CURRENT (config) · image build NOT_YET_VERIFIED (Docker daemon local off) |
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

## 4. Python 3.12 (TARGET, chưa verify)
- Python 3.10 gần EOL; đích là 3.12.
- **Chưa chứng minh** được vì cần build image sạch bằng Docker mà **Docker daemon local hiện không chạy**.
- Kế hoạch (khi có Docker): build image `python:3.12-slim` → install requirements → `pip check` → `pytest` với Postgres disposable → smoke import app + alembic. Chỉ nâng version dependency khi có lỗi tương thích thực, từng gói một, ghi lý do. KHÔNG nhảy 3.13/3.14.
- CI hiện để `python-version: "3.10"` (proven); nâng 3.12 sau khi verify.

## 5. Edge / DNS policy (TARGET)
- Vercel frontend record → Cloudflare **DNS-only**.
- Render API record → Cloudflare **proxy/WAF** candidate.
- KHÔNG đặt Cloudflare proxy trước frontend Vercel.

## 6. CI pipeline hiện tại (`.github/workflows/ci.yml`)
- **backend**: service PostgreSQL 17.6 + Redis, Python 3.10, cài requirements(+dev), `alembic upgrade head`, `pytest`.
- **frontend**: Node 22, `npm ci`, `vitest --run`, `vite build`.
- **docker**: `docker build ./expense-tracker-be`.
- Secrets: KHÔNG nhúng; dùng GitHub Actions secrets khi thêm CD.

## 7. Wave 04 (PRODUCTION_GATED — chưa làm)
GitHub branch protection + remote CI verify · Vercel FE deploy · Render BE Docker deploy ·
Render Key Value/Valkey · Neon branch-based migration rehearsal · pooled vs direct connection ·
Cloudflare DNS + WAF · health/readiness · structured logging + Sentry · backup/rollback runbook ·
production smoke. **Không migration production nếu chưa có Human Gate.**
