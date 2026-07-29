# PROJECT ROADMAP — Expense Tracker Web (Thesis Upgrade v2.0)

> Bản đồ tiến độ chủ chốt của dự án. Cập nhật sau MỖI Phase/Wave.
> Đây là file quản trị (governance), KHÔNG phải report phân tích.
> Quy ước trạng thái: `LANDED` `PASS` `PASS_WITH_BLOCKER` `CURRENT` `BLOCKED` `DEFERRED` `NOT_APPLICABLE` `UNKNOWN_EXTERNAL`
> Không dùng "DONE 100%" / "PRODUCTION_READY" khi chỉ mới kiểm tra local.

Baseline hiện tại: branch `main` · HEAD `9f0c2714` · worktree `DIRTY_WORKTREE_EXPECTED` (drift người dùng, protected).

---

## 1. TỔNG QUAN PHASE

| Phase | Tên | Trạng thái | Verdict |
|---|---|---|---|
| 01 | Architecture Audit (read-only) | ✅ LANDED | `READ_ONLY_AUDIT_PASS_WITH_GAPS` |
| 02 | Architecture Design (Option A) | ✅ LANDED | `DESIGN_READY` (Option A: Layered Modular) |
| 03A | Wave 0 — Foundation & Test Harness | ✅ PASS | `FOUNDATION_WAVE_00_LOCAL_PASS` |
| 03B | Wave 1 — Security Hardening | ✅ PASS | `SECURITY_HARDENING_WAVE_01_LOCAL_PASS` |
| 03C | Wave 2 — DB Migration Rebuild & Tests | 🔄 CURRENT (unlocked) | (sẵn sàng bắt đầu) |
| 03D | Wave 3 — Repo Hygiene & FE Clean Code | ⛔ BLOCKED | — |
| 03E | Wave 4 — Infra / CI-CD Gate / Observability | ⛔ BLOCKED | — |

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
| F4 | HIGH | Migration không dựng lại schema từ zero | Wave 2 |
| F11 | HIGH | Không có test nào (FE+BE) | Wave 0→2 |
| F7 | MEDIUM | Thiếu transaction lock | Wave 2 |
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
