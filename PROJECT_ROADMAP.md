# PROJECT ROADMAP — Expense Tracker Web (Thesis Upgrade v2.0)

> Bản đồ tiến độ chủ chốt của dự án. Cập nhật sau MỖI Phase/Wave.
> Đây là file quản trị (governance), KHÔNG phải report phân tích.
> Quy ước trạng thái: `LANDED` `PASS` `PASS_WITH_BLOCKER` `CURRENT` `BLOCKED` `DEFERRED` `NOT_APPLICABLE` `UNKNOWN_EXTERNAL`
> Không dùng "DONE 100%" / "PRODUCTION_READY" khi chỉ mới kiểm tra local.

Baseline hiện tại: branch `main` · HEAD `afde4ca` (đã merge PR #3 Wave04A1) · worktree `DIRTY_WORKTREE_EXPECTED` (drift người dùng, protected).
Wave đang chạy: `wave04a2/external-runtime-proof` (nhánh off `afde4ca`).

---

## 1. TỔNG QUAN PHASE

| Phase | Tên | Trạng thái | Verdict |
|---|---|---|---|
| 01 | Architecture Audit (read-only) | ✅ LANDED | `READ_ONLY_AUDIT_PASS_WITH_GAPS` |
| 02 | Architecture Design (Option A) | ✅ LANDED | `DESIGN_READY` (Option A: Layered Modular) |
| 03A | Wave 0 — Foundation & Test Harness | ✅ PASS | `FOUNDATION_WAVE_00_LOCAL_PASS` |
| 03B | Wave 1 — Security Hardening | ✅ PASS | `SECURITY_HARDENING_WAVE_01_LOCAL_PASS` |
| 03C | Wave 2 — DB Migration Rebuild & Tests | ✅ PASS | `DB_MIGRATION_REGRESSION_WAVE_02_LOCAL_PASS` |
| 03D | Wave 3 — Repo Hygiene & FE Clean Code | ⛔ BLOCKED | — |
| 03E | Wave 4 — Infra / CI-CD Gate / Observability | ⛔ BLOCKED | — |
| 04A0 | Integration contract + Auth E2E hardening (health/readiness, API URL, CORS, session) | ✅ PASS (merged PR #2 → `fa263731`) | `WAVE_04A0_PASS_WITH_EXTERNAL_GATES` · REMOTE_CI_VERIFIED |
| 04A1 | External auth E2E · Render↔Neon↔Firebase wiring · migration URL authority · storage matrix | ✅ PASS (merged PR #3 → `afde4ca`) | `WAVE_04A1_CODE_PASS_MANUAL_WIRING_REQUIRED` |
| 04A2 | Secret quarantine · PR#3 URL-validator review gaps (A/B) · external runtime proof | 🔶 PASS_WITH_BLOCKER (Gate 0/2 code PASS; external E2E chờ RENDER_BACKEND_URL thật) | `WAVE_04A2_PASS_WITH_BROWSER_AUTOMATION_GATE` (dự kiến) |

---

## 2. QUYẾT ĐỊNH KIẾN TRÚC ĐÃ CHỐT (Phase 02 SAFE_DEFAULT)
- **DECISION_01 Celery** → DEFERRED (giữ nguyên `celery_app.py`, `tasks/`; chứng minh/loại bỏ ở Wave 3).
- **DECISION_02 Token Revocation** (sessions/token_version/refresh) → DEFERRED sang v2.1.
- **DECISION_03 Folder rename** (`cruds/`→`repositories/`, `db/`→`database/`) → REJECTED cho Phase 03 (giữ tên).
- **DECISION_04 Architecture** → GIỮ Layered Pragmatic Monolith (không Full Clean Architecture).

---

## 3. FINDINGS ƯU TIÊN (từ Audit Phase 01) & WAVE XỬ LÝ

| ID | Mức | Vấn đề | Wave |
|---|---|---|---|
| F1 | CRITICAL | `SECRET_KEY` hardcode default | Wave 1 |
| F2 | HIGH | `DATABASE_URL` hardcode default | Wave 1 |
| F3 | CRITICAL | Không rate limiting (login/2FA/chat) | Wave 1 |
| F5 | HIGH | Chat LLM: cost/injection/lộ lỗi | Wave 1 |
| F6 | MEDIUM | bare `except:` / trả `str(e)` | Wave 1 |
| F15 | LOW | Token expiry mismatch (15p vs 30p) | Wave 1 |
| F4 | HIGH | Migration không dựng lại schema từ zero | Wave 2 ✅ FIXED (baseline `a1b2c3d4e5f6`) |
| F11 | HIGH | Không có test nào (FE+BE) | Wave 0→2 ✅ (18 BE + 2 FE) |
| F7 | MEDIUM | Thiếu transaction lock | Wave 2 → `NOT_APPLICABLE` (aggregate-on-read, đã có test toàn vẹn) |
| F9 | LOW | `__pycache__`/`.idea` bị commit | Wave 3 |
| F10 | LOW/MED | Dup `.js/.jsx`, `*Unified` dead code | Wave 3 |
| F12 | LOW | Dep bloat (Django/Booktype) | Wave 3 |
| F8 | HIGH | CI chỉ mirror + force-push, không gate | Wave 4 |
| F13 | MEDIUM | Không IaC start command in-repo | Wave 4 |
| F14 | MEDIUM | Không structured log / Sentry | Wave 4 |

---

## 4. TIẾN ĐỘ WAVE 0 (FOUNDATION)

| Mục tiêu | Trạng thái |
|---|---|
| Baseline verification (HEAD thực tế) | ✅ PASS |
| Pre-existing drift protection | ✅ PASS |
| Toolchain inventory (BE/FE) | ✅ PASS |
| `CLAUDE.md` (governance) | ✅ LANDED |
| `PROJECT_ROADMAP.md` (file này) | ✅ LANDED |
| `.gitignore` — chặn report/reference/test-cache | ✅ LANDED |
| Backend test skeleton (`tests/`) | ✅ LANDED (chưa execute) |
| Backend dev manifest (`requirements-dev.txt`, `pytest.ini`) | ✅ LANDED |
| Backend harness EXECUTE (pytest discovery + sanity) | ✅ PASS — 2 passed |
| Frontend harness (vitest) | ✅ PASS — 2 passed |

**Blocker:** đã gỡ. Dependencies đã cài (BE: `pytest`/`pytest-asyncio`; FE: `vitest`/`jsdom`/`@testing-library/*`).

---

## 4.1 TIẾN ĐỘ WAVE 1 (SECURITY HARDENING) — `SECURITY_HARDENING_WAVE_01_LOCAL_PASS`

| Finding | Mục tiêu | File | Trạng thái |
|---|---|---|---|
| F1 | Xoá default `SECRET_KEY`, fail-closed | `core/config.py` | ✅ PASS |
| F2 | Xoá default `DATABASE_URL`, fail-closed | `core/config.py` | ✅ PASS |
| F3 | Rate limit login/2FA/chat (429) | `core/rate_limit.py`, `main.py`, 3 routes | ✅ PASS |
| F5 | Chat guardrail: ẩn lỗi LLM + rate limit | `routes/chat_route.py` | ✅ PASS |
| F6 | Exception sanitization + xoá legacy `get_current_user` | `core/exceptions.py`, `main.py`, `core/security.py`, 3 routes | ✅ PASS |
| F15 | Token expiry authority (1 nguồn) | `core/config.py`, `core/security.py` | ✅ PASS |

**Bằng chứng test (local):** `pytest` → 5 passed (2 harness + 3 security: SEC-01 fail-closed, SEC-02 rate-limit 429, SEC-03 error sanitization). `vitest run` → 2 passed. `vite build` → OK.

**Quyết định vận hành đã chốt:** rate-limit store = Redis (fallback in-memory khi local không có Redis); fail-closed tuyệt đối (thiếu ENV → app raise); test theo Red-Green + hybrid unit/mock.

> ⚠️ Chưa Alembic/production; chưa deploy; chưa commit/push. Chỉ LOCAL PASS.

---

## 4.2 TIẾN ĐỘ WAVE 2 (DB MIGRATION REBUILD & REGRESSION) — `DB_MIGRATION_REGRESSION_WAVE_02_LOCAL_PASS`

**Schema authority chốt:** `TARGET_TABLE_SET_7` (users, categories, transactions, incomes, expenses,
audit_logs, system_settings) — giữ đúng metadata runtime + REST contract của FE.

| Mục tiêu | Chi tiết | Trạng thái |
|---|---|---|
| Test authority | PostgreSQL 17.6 local, DB `expense_tracker_test`, role least-priv `et_test`, NO_TARGET_GUARD | ✅ PASS |
| F4 Migration rebuild-from-zero | Squash `e92cd622d537` (delta-hỏng) → baseline mới `a1b2c3d4e5f6` (7 bảng); `downgrade base`→`upgrade head` sạch | ✅ FIXED |
| env.py | Ưu tiên `TEST_DATABASE_URL` + guard chống Neon; `models/__init__` nạp đủ 7 bảng (hết split-brain) | ✅ PASS |
| Hermetic test infra | `conftest`: engine test, `db_session` cô lập SAVEPOINT-rollback, override `get_db`/auth; offline auto-skip | ✅ PASS |
| Regression MIG-01..03 | rebuild-from-zero, parity schema↔ORM, PK/FK CASCADE/unique index | ✅ 3 PASS |
| Regression DAT-01..06 | seed idempotent, tổng dashboard, ownership isolation, money>0, rollback atomicity, budget | ✅ PASS |
| Bug ẩn LIVE | `crud_summary.get_monthly_budget_status` đọc nhầm `budget_limit`→`monthly_budget` (luôn =0) | ✅ FIXED + test |
| F7 Concurrency | Aggregate-on-read (không lưu balance) → `NOT_APPLICABLE`; test toàn vẹn create/update/delete xen kẽ | ✅ PASS |
| Docker + CI/CD | `Dockerfile`, `docker-compose.yml` (BE+PG17.6+Redis), `.github/workflows/ci.yml` (pytest+vitest+build) | ✅ ADDED |

**Bằng chứng test (local):** `pytest` (có `TEST_DATABASE_URL`) → **18 passed**; offline (không DB) → 5 passed, 13 skipped. `vitest run` → 2 passed. `vite build` → OK.

**Tech-debt ghi nhận (Wave 02C — cần phê duyệt):** hàm legacy TRÙNG LẶP trong `crud_summary.py:86–289` (bị shadow, DEAD_LEGACY) + bảng `incomes`/`expenses` vestigial → hợp nhất về 5 bảng khi dọn code + xác nhận Neon không còn dữ liệu cần giữ. `crud_summary.py:58` `get_monthly_summary` bản đầu dùng `transaction_date` (không tồn tại) — dead/shadowed.

> ⚠️ CHƯA chạm Neon/production. Reconcile Neon = `alembic stamp a1b2c3d4e5f6` (GATED, chưa chạy). Chưa deploy. Chưa commit Wave 2.

---

## 5. FILE KHÔNG ĐẨY LÊN GIT (do-not-push — theo yêu cầu người dùng)
Đã thêm vào `.gitignore`. Các nhóm sau chỉ tồn tại local:
- Tham chiếu thiết kế: `image_structure/`
- Report/asset lưu trữ: `report-in4/`, các `*_REPORT.md` cũ
- Bằng chứng audit/skill: `KetQua-Audit.md`, `README_andrej-karpathy-skills.md`
- Cache test/coverage: `.pytest_cache/`, `htmlcov/`, `.coverage`, `**/coverage/`
- (Đã ignore sẵn từ trước) `**/__pycache__/`, `**/.venv/`, `**/.env`, `**/serviceAccountKey.json`

> Lưu ý: `__pycache__/` và `.idea/` HIỆN ĐANG BỊ TRACK (đã commit trước đây). `.gitignore` chỉ chặn file mới; việc gỡ khỏi git index (`git rm --cached`) để dành Wave 3.

---

## 6. LỆNH CẦN HUMAN OPERATOR PHÊ DUYỆT (mở khóa Wave 0)
```bash
# Backend (trong venv sẵn có):
cd expense-tracker-be && .venv/Scripts/python -m pip install -r requirements-dev.txt
#   requirements-dev.txt: pytest==8.3.4, pytest-asyncio==0.24.0

# Frontend (giữ nguyên package manager = npm, lockfile package-lock.json):
cd expense-tracker && npm install -D vitest@^2.1.0 jsdom@^25.0.0 @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.5.0
```
Sau khi cài, chạy lại Wave 0 validation để chuyển các mục BLOCKED → PASS.

---

## 7. NHẬT KÝ CẬP NHẬT
- Phase 01 → verdict `READ_ONLY_AUDIT_PASS_WITH_GAPS` (17 findings F1–F17).
- Phase 02 → Option A (Layered Modular) + Migration Waves 1–4 + thiết kế CLAUDE.md/Token-Revocation.
- Wave 0 → tạo governance + test skeleton; STOP chờ phê duyệt cài test dependency.
- Wave 0 (đóng) → cài BE dev-deps + FE test-deps; harness `pytest`/`vitest` PASS → `FOUNDATION_WAVE_00_LOCAL_PASS`.
- Wave 1 → bịt F1/F2/F3/F5/F6/F15; 3 security test PASS; FE build OK → `SECURITY_HARDENING_WAVE_01_LOCAL_PASS`. Mở khoá Wave 2.
- Wave 00/01 LAND → 2 commit local `1c92e9cb` (foundation) + `e7f14c00` (security). HEAD `9f0c2714`→`e7f14c00`.
- Wave 2 → PG17.6 test authority; squash migration → baseline 7 bảng (F4 FIXED); bug budget FIXED; 18 BE test PASS + Docker/CI → `DB_MIGRATION_REGRESSION_WAVE_02_LOCAL_PASS`. Mở khoá Wave 3.
