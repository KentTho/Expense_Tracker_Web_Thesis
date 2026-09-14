# CODEBASE MAP — Expense Tracker Web v2.0

> Tài liệu kiến trúc lâu dài (KHÔNG phải report của một wave). Phản ánh source hiện tại
> sau Wave 03 Foundation Consolidation. Cập nhật khi thêm/xóa/di chuyển file có ý nghĩa.
>
> Kiến trúc: **Layered Pragmatic Monolith**. Luồng backend: `routes/` (HTTP boundary) →
> `cruds/` (data access) / `services/` (workflow) → `models/` (ORM) → PostgreSQL.
> Luồng frontend: `pages/` + `components/` → `services/` (API client) → Backend REST.
>
> STATUS: ACTIVE · LEGACY_COMPAT · TEST · INFRA · GOVERNANCE · UTILITY

## 1. BACKEND (`expense-tracker-be/`)

### 1.1 Entrypoint & core
| Path | Layer | Purpose | Status |
|---|---|---|---|
| `main.py` | app | Khởi tạo FastAPI, init Firebase Admin inline từ ENV `FIREBASE_SERVICE_ACCOUNT` (dòng 48–63), lifespan (Redis + seed categories), CORS, đăng ký 14 router | ACTIVE |
| `core/config.py` | config | `Settings` (pydantic-settings) fail-closed: SECRET_KEY, DATABASE_URL bắt buộc; CORS; token expiry (F1/F2/F15) | ACTIVE |
| `core/security.py` | security | Tạo/verify JWT access token, hash mật khẩu | ACTIVE |
| `core/exceptions.py` | security | Handler sanitize lỗi: HTTP/validation/unhandled → JSON generic, không lộ nội tình (F5/F6) | ACTIVE |
| `core/rate_limit.py` | security | slowapi limiter; Redis nếu ping OK, else in-memory (F3) | ACTIVE |
| `core/cache.py` | infra | Init/close Redis, health check (optional cache) | ACTIVE |

### 1.2 Routes (HTTP boundary) — `routes/`
| Path | Auth | CRUD/Service | DB tables | Status |
|---|---|---|---|---|
| `auth_route.py` | public/JWT | crud_user, auth_service, auth_token_db | users | ACTIVE |
| `income_route.py` | JWT | crud_income | transactions | ACTIVE |
| `expense_route.py` | JWT | crud_expense | transactions | ACTIVE |
| `transaction_route.py` | JWT | crud_transaction | transactions | ACTIVE |
| `category_route.py` | JWT | crud_category | categories | ACTIVE |
| `dashboard_route.py` | JWT | crud_summary | transactions, users | ACTIVE |
| `summary_route.py` | JWT | crud_summary | transactions | ACTIVE |
| `analytics_route.py` | JWT | crud_analytics, crud_summary | transactions | ACTIVE |
| `export_route.py` | JWT | crud_income, crud_expense (pandas→xlsx) | transactions | ACTIVE |
| `security_route.py` | JWT | crud_security | users | ACTIVE |
| `admin_route.py` | JWT+admin | crud_admin, crud_audit | users, categories, audit_logs, system_settings | ACTIVE |
| `system_route.py` | JWT/admin | crud_system | system_settings | ACTIVE |
| `chat_route.py` | JWT | chat_service | transactions, categories, users | ACTIVE |
| `health_route.py` | public | — (DB `SELECT 1`, Redis health) | — | ACTIVE (Wave04A0: `GET /health` liveness, `GET /ready` readiness) |

Guard: `services/auth_token_db.get_current_user_db` (JWT + single-device), `get_current_admin_user` (403 nếu không admin).

### 1.3 Services (workflow) — `services/`
| Path | Purpose | Status |
|---|---|---|
| `auth_token_db.py` | Xác thực token (JWT + Firebase), dependency current-user / current-admin | ACTIVE |
| `auth_service.py` | Logic đăng nhập/đăng ký, session key | ACTIVE |
| `chat_service.py` | Orchestrate FinBot (LangChain + Gemini), sanitize lỗi trước khi trả | ACTIVE |
| `chat_tools.py` | Định nghĩa tool FinBot (ghi giao dịch, thống kê, admin tools); lỗi tool đã sanitize | ACTIVE |

### 1.4 CRUDs (data access) — `cruds/`
| Path | Purpose | DB tables | Status |
|---|---|---|---|
| `base_mixin.py` | Helper CRUD dùng chung | — | ACTIVE |
| `crud_user.py` | User CRUD, tra cứu theo email/firebase_uid | users | ACTIVE |
| `crud_category.py` | Category CRUD + seed 17 default categories | categories | ACTIVE |
| `crud_transaction.py` | Nguồn ghi giao dịch hợp nhất (income+expense) | transactions | ACTIVE |
| `crud_income.py` | API income → ghi/đọc trên `transactions` (type=income) | transactions | ACTIVE |
| `crud_expense.py` | API expense → ghi/đọc trên `transactions` (type=expense) | transactions | ACTIVE |
| `crud_summary.py` | Tổng hợp dashboard/summary/KPI/budget (aggregate-on-read) | transactions, users | ACTIVE |
| `crud_analytics.py` | Dữ liệu phân tích/xu hướng | transactions | ACTIVE |
| `crud_admin.py` | KPI hệ thống, quản lý user/category mặc định, settings | users, categories, system_settings | ACTIVE |
| `crud_audit.py` | Ghi/đọc audit log | audit_logs | ACTIVE |
| `crud_security.py` | 2FA (secret/verify), cài đặt bảo mật | users | ACTIVE |
| `crud_system.py` | Cấu hình hệ thống | system_settings | ACTIVE |

### 1.5 Models (ORM) — `models/`
| Path | Table | Status |
|---|---|---|
| `user_model.py` | users | ACTIVE |
| `category_model.py` | categories | ACTIVE |
| `transaction_model.py` | transactions (canonical write path) | ACTIVE |
| `income_model.py` | incomes | LEGACY_COMPAT (vestigial — giữ parity metadata; không có active query) |
| `expense_model.py` | expenses | LEGACY_COMPAT (vestigial — như trên) |
| `audit_model.py` | audit_logs | ACTIVE |
| `system_model.py` | system_settings | ACTIVE |
| `models/__init__.py` | — | ACTIVE (nạp đủ 7 model → Base.metadata nhất quán) |
| `models/check_models.py` | — | UTILITY (script kiểm tra thủ công, không nằm trong runtime) |

### 1.6 Schemas — `schemas/` (Pydantic request/response, 1 file / domain) — ACTIVE
`admin, analytics, audit, category, chat, dashboard, expense, export, income, security, summary, system, transaction, user`.

### 1.7 DB & migrations
| Path | Purpose | Status |
|---|---|---|
| `db/database.py` | Engine sync/async (runtime `DATABASE_URL`, pooled), `SessionLocal`, `get_db` dependency, `Base` | ACTIVE |
| `db/migration_url.py` | Authority chọn URL migration: `TEST_DATABASE_URL` (guard) → `DATABASE_MIGRATION_URL` (direct) → `DATABASE_URL` (runtime fallback); testable, không leak URL | ACTIVE (Wave04A1) |
| `alembic/env.py` | Dùng `resolve_migration_url(runtime_url=settings.DATABASE_URL)`; target=Base.metadata | ACTIVE |
| `alembic/versions/a1b2c3d4e5f6_baseline_full_schema.py` | Baseline new-install: 7 bảng từ zero (Option C squash) | ACTIVE |

### 1.8 Utility/legacy scripts (KHÔNG thuộc runtime API)
| Path | Purpose | Status |
|---|---|---|
| `check_models.py` (root) | Script kiểm tra model thủ công | UTILITY |
| `firebase_admin_init.py` | Helper init Firebase (file→ENV). **KHÔNG được main.py import** — runtime init nằm inline ở `main.py:48-63` (chỉ đọc ENV). | UTILITY / UNUSED_RUNTIME (trùng logic main.py; comment "Railway" đã cũ → Render) |
| `reset_alembic.py` | Script reset alembic local | UTILITY |

### 1.9 Tests — `tests/`
| Path | Nhóm | Status |
|---|---|---|
| `tests/conftest.py` | Hermetic fixtures (engine rebuild-from-zero, SAVEPOINT rollback, overrides) | TEST |
| `tests/harness/test_harness_bootstrap.py` | HARNESS (2) | TEST |
| `tests/api/test_security.py` | SECURITY (3) | TEST |
| `tests/api/test_error_sanitization.py` | SEC-ERR admin/auth/security/chat (4) | TEST |
| `tests/db/test_migration.py` | MIG-01..03 (3) | TEST |
| `tests/db/test_data_regression.py` | DAT-01..06 + F7 (10) | TEST |
| `tests/db/test_migration_url_authority.py` | Precedence + guard URL migration (8, offline) | TEST (Wave04A1) |
| `tests/api/test_health_and_cors.py` | Health/readiness + CORS contract (5, offline) | TEST (Wave04A0) |
| `tests/api/test_auth_sync_contract.py` | `/auth/sync` idempotent/recover/2FA (3, DB-suite) | TEST (Wave04A0) |

## 2. FRONTEND (`expense-tracker/src/`)

### 2.1 Entry & routing
| Path | Purpose | Status |
|---|---|---|
| `main.jsx` | React root render | ACTIVE |
| `App.jsx` | Router: public routes + ProtectedRoute(DashboardLayout) + AdminRoute(/admin/*) | ACTIVE |
| `components/ProtectedRoute.jsx` | Guard đăng nhập → /login | ACTIVE |
| `components/AdminRoute.jsx` | Guard admin → /dashboard nếu không admin | ACTIVE |
| `layouts/DashboardLayout.jsx` | Layout + Sidebar + FinBot, theme, auth watch | ACTIVE |

### 2.2 Pages
| Path | Route | Status |
|---|---|---|
| `pages/Auth/{Login,SignUp,ForgotPassword,ChangePassword}.jsx` | public | ACTIVE |
| `pages/Dashboard/Home.jsx` | /dashboard | ACTIVE |
| `pages/Dashboard/Analytics.jsx` | /analytics | ACTIVE |
| `pages/Dashboard/{Income,Expense,Category}.jsx` | /income /expense /categories | ACTIVE |
| `pages/Dashboard/ExportData.jsx` | /dataexport | ACTIVE |
| `pages/Dashboard/Profile.jsx` | /profile | ACTIVE |
| `pages/Dashboard/SecuritySettings.jsx` | /security | ACTIVE |
| `pages/Admin/{AdminDashboard,AdminUserManagement,AdminDefaultCategories,AdminSystemSettings,AdminAuditLogs}.jsx` | /admin/* | ACTIVE |

### 2.3 Services (API client, `.js`) — ACTIVE
`api.js` (canonical fetch client + `authorizedFetch` + `forceLogout` = single logout authority; `resolveBackendBase` = authority chuẩn hoá origin backend, **fail-closed** ở production build — xem STACK_AND_DEPLOYMENT §8.1), `adminService, analyticsService, authService, categoryService, chatService, dashboardService, expenseService, incomeService, profileService, securityService, transactionService`.

### 2.4 Components & utils
| Path | Purpose | Status |
|---|---|---|
| `components/Sidebar.jsx` | Nav chính (personal/admin theo `user.is_admin`) | ACTIVE |
| `components/FinBotWidget.jsx` | Widget chat AI | ACTIVE |
| `components/firebase.jsx` | Init Firebase client | ACTIVE |
| `components/dashboard/*` | OverviewHeader, MetricCard, BudgetCard, DashboardSkeleton | ACTIVE |
| `components/transactions/*` | List, FormModal, DetailModal, ConfirmDelete, EmptyState | ACTIVE |
| `components/ui/*` | ErrorBoundary, FormField, PageHeader, SectionCard, StatusBadge | ACTIVE |
| `components/{AppGuide,AuthLayout,ExportStatusModal,LanguageSwitcher,QRCodeModal,WelcomeSplash}.jsx` | UI phụ trợ | ACTIVE |
| `data/defaultCategories.jsx` | Dữ liệu category mặc định (rà: nếu không chứa JSX nên đổi `.js`) | ACTIVE |
| `utils/authHelper.js` | `getToken`, `getStoredUser` (Wave04A0 đã gỡ `handleForceLogout`/`authorizedFetch` trùng — logout/HTTP authority về `api.js`) | ACTIVE |
| `utils/formatters.js` | Format tiền tệ/ngày | ACTIVE |
| `test/{setup.js,sanity.test.jsx,routeGuards.test.jsx,apiClient.test.jsx,authService.test.jsx}` | Vitest harness + FE-AUTH/API-client/session tests | TEST |

## 3. INFRASTRUCTURE
| Path | Purpose | Status |
|---|---|---|
| `expense-tracker-be/Dockerfile` + `.dockerignore` | Image backend (alembic upgrade + uvicorn) | INFRA |
| `docker-compose.yml` | Stack dev/test (backend + PostgreSQL 17.6 + Redis) | INFRA |
| `.github/workflows/ci.yml` | CI canonical: backend (PG+Redis, pytest) · frontend (Node 22, vitest+build) · docker build | INFRA |
| `CLAUDE.md` | Governance thực thi AI + Software Authorities | GOVERNANCE |
| `PROJECT_ROADMAP.md` | Tiến độ theo Wave | GOVERNANCE |

## 4. NỢ KỸ THUẬT GHI NHẬN (không sửa ngoài scope)
- Bảng `incomes`/`expenses`: LEGACY_COMPAT, không có active query → chờ rehearsal Neon rồi mới retire (Wave sau, PRODUCTION_GATED).
- `transactions` chưa có composite index `(user_id, date)` (nợ hiệu năng khi data lớn).
- FE bundle 1 chunk ~1.9MB (chưa code-split).
- `data/defaultCategories.jsx`, `models/check_models.py`, `firebase_admin_init.py`, `reset_alembic.py`: rà lại quy ước đuôi/utility.
- Python runtime 3.12 (CURRENT, đã verify clean-build Docker `python:3.12-slim` + full pytest — xem STACK_AND_DEPLOYMENT).
- `requirements.txt`: đã gỡ `langgraph` (UNUSED_DIRECT). Còn orphan `langgraph-checkpoint`/`langgraph-sdk` + transitive celery cũ (`amqp`/`billiard`/`kombu`/`vine`) — chờ pass dọn dependency riêng, KHÔNG broad-prune phase này.
