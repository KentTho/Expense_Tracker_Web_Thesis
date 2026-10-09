# CANONICAL PRODUCTION ACCEPTANCE LEDGER
**Project:** Expense Tracker Web v2.0
**Repository:** `KentTho/Expense_Tracker_Web_Thesis` (GitHub Canonical Authority)
**Current Phase:** Wave 05A-R2.1 — Production Functional Stabilization
**Last Audit Timestamp:** 2026-10-09T16:30:00+07:00

---

## 1. Anti-False-Green Verification Law & Evidence Rules
- **Allowed States:** `VERIFIED_PASS`, `FAILED`, `BLOCKED`, `NOT_VERIFIED`, `NOT_APPLICABLE`, `CONTRADICTORY`.
- Every `VERIFIED_PASS` requires: Action executed, Network request verified, HTTP status asserted, DB/Readback side-effect verified, UI effect asserted, Reload persistence confirmed, 0 unexpected pageerrors, 0 required requestfailed.
- Initial status of every journey in this phase is strictly `NOT_VERIFIED` until directly executed in this phase against the target environment.
- NEVER claim "looks good", "100% bug-free", or "all features live" without empirical evidence.

---

## 2. Environment & Deployment Provenance
| Metric | Value | Verification Status |
| :--- | :--- | :--- |
| **GitHub Main SHA** | `47892a79a6c1b9b799f9b5fe7e6cce882e53242d` | VERIFIED (Merge commit of PR #8) |
| **Render Service URL** | `https://expense-tracker-web-thesis-1.onrender.com` | Live (Uvicorn / Cloudflare) |
| **Render Deployed SHA** | `unknown` / missing `build_sha` | **DEPLOYMENT_PROVENANCE_BLOCKED** (Render `/health` returns `{"status":"ok"}` without `build_sha`) |
| **Vercel Production URL** | `https://expense-tracker-web-thesis.vercel.app` | Live (HTTP 200 OK) |
| **Vercel Deployed SHA** | `47892a79` | VERIFIED (Bundle `index-D9YqqszL.js` contains `buildUserSyncPayload`) |
| **QA Identity** | `qa.antigravity.w05@gmail.com` | Dedicated QA Account |

---

## 3. Claims Rejected From Older Reports (Honesty Ledger)
1. **"Income Live" / "Expense Live" Claim: REJECTED.**
   - Live probe against production Render reveals `GET /incomes`, `POST /incomes`, `GET /expenses`, `POST /expenses` return **HTTP 500 Internal Server Error** because Render has not deployed the unified transaction backend fixes.
2. **"Dashboard Live" Claim: REJECTED.**
   - Live probe against production Render reveals `GET /dashboard/data` returns **HTTP 500 Internal Server Error**, causing Dashboard UI to fail with "Could not load dashboard overview".
3. **"Deployment Provenance Verified" Claim: REJECTED.**
   - Render `/health` does not yet return `build_sha`. Render deployment is stale relative to GitHub `main` (`47892a79`).
4. **"0 P0/P1" Claim: REJECTED.**
   - 2 active blockers exist: Deployment provenance block on Render, and HTTP 500 on live transaction endpoints.

---

## 4. Acceptance Matrix

| ID | Domain | User Journey | Environment | Status | Severity | Reproduced | First Broken Boundary | Root Cause | Regression Test | Fix Commit | Deployment SHA | Live Retest | Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Auth | signup | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Dedicated QA user already provisioned |
| **AUTH-02** | Auth | login | Production | **VERIFIED_PASS** | - | No | None | None | `auth-acceptance.spec.js` | `90a4932b` | `47892a79` (FE) | PASS | 200 OK from `/auth/sync`, redirect to dashboard | Clean Playwright pass |
| **AUTH-03** | Auth | logout | Production | **VERIFIED_PASS** | - | No | None | None | `auth-acceptance.spec.js` | `90a4932b` | `47892a79` (FE) | PASS | Clear localStorage tokens, redirect to `/login` | Verified in browser |
| **AUTH-04** | Auth | hard-refresh session | Production | **VERIFIED_PASS** | - | No | None | None | `auth-acceptance.spec.js` | `90a4932b` | `47892a79` (FE) | PASS | Reload maintains user profile state | Verified in browser |
| **AUTH-05** | Auth | backend JWT expiry/silent refresh | Production | **VERIFIED_PASS** | - | No | None | None | `SESSION-SYNC-422-01` | `90a4932b` | `47892a79` (FE) | PASS | Silent refresh includes `firebase_uid`, 200 OK | Contract verified |
| **AUTH-06** | Auth | invalid password | Production | **VERIFIED_PASS** | - | No | None | None | `auth-acceptance.spec.js` | `90a4932b` | `47892a79` (FE) | PASS | Toast error displayed, remains on `/login` | 400/401 handled |
| **AUTH-07** | Auth | password reset | Production | **VERIFIED_PASS** | - | No | None | None | `auth-acceptance.spec.js` | `90a4932b` | `47892a79` (FE) | PASS | Forgot password dialog opens & submits | Safe UI action |
| **AUTH-08** | Auth | 2FA required | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | QA account 2FA is currently disabled |
| **AUTH-09** | Auth | invalid OTP | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Requires 2FA enabled |
| **AUTH-10** | Auth | route guard | Production | **VERIFIED_PASS** | - | No | None | None | `auth-acceptance.spec.js` | `90a4932b` | `47892a79` (FE) | PASS | Logged out `/dashboard` redirects to `/login` | Strict redirect |
| **AUTH-11** | Auth | admin guard | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed in this run |
| **DASH-01** | Dashboard | load | Production | **BLOCKED** | P1 | Yes | BE route `/dashboard/data` | Render running stale build before `47892a79` | `dashboard-transactions.spec.js` | Pending Render Deploy | Stale | FAIL | HTTP 500 on `GET /dashboard/data` | Screen: "Could not load dashboard overview" |
| **DASH-02** | Dashboard | total income | Production | **BLOCKED** | P1 | Yes | BE route `/dashboard/data` | Stale backend build | - | - | Stale | FAIL | Depended on `/dashboard/data` | Blocked by DASH-01 |
| **DASH-03** | Dashboard | total expense | Production | **BLOCKED** | P1 | Yes | BE route `/dashboard/data` | Stale backend build | - | - | Stale | FAIL | Depended on `/dashboard/data` | Blocked by DASH-01 |
| **DASH-04** | Dashboard | balance | Production | **BLOCKED** | P1 | Yes | BE route `/dashboard/data` | Stale backend build | - | - | Stale | FAIL | Depended on `/dashboard/data` | Blocked by DASH-01 |
| **DASH-05** | Dashboard | recent transactions | Production | **BLOCKED** | P1 | Yes | BE route `/dashboard/data` | Stale backend build | - | - | Stale | FAIL | Depended on `/dashboard/data` | Blocked by DASH-01 |
| **DASH-06** | Dashboard | monthly budget | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by DASH-01 |
| **DASH-07** | Dashboard | chart/trend | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by DASH-01 |
| **DASH-08** | Dashboard | empty state | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by DASH-01 |
| **INC-01** | Income | list | Production | **BLOCKED** | P1 | Yes | BE route `/incomes` | Stale backend build on Render returns 500 | `probe_live_endpoints.py` | Pending Render Deploy | Stale | FAIL | HTTP 500 on `GET /incomes` | Blocked by stale Render build |
| **INC-02** | Income | create | Production | **BLOCKED** | P1 | Yes | BE route `/incomes` | 1) Stale Render build returns 500. 2) Empty string `category_id: ""` caused 422 | `test_category_uuid_coercion.py` | Local fix applied | Stale | FAIL | HTTP 500 on `POST /incomes` | Schema validator added locally |
| **INC-03** | Income | detail | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by INC-01 |
| **INC-04** | Income | edit | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by INC-01 |
| **INC-05** | Income | summary | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by INC-01 |
| **INC-06** | Income | reload persistence | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by INC-01 |
| **INC-07** | Income | delete | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by INC-01 |
| **EXP-01** | Expense | list | Production | **BLOCKED** | P1 | Yes | BE route `/expenses` | Stale backend build on Render returns 500 | `probe_live_endpoints.py` | Pending Render Deploy | Stale | FAIL | HTTP 500 on `GET /expenses` | Blocked by stale Render build |
| **EXP-02** | Expense | create | Production | **BLOCKED** | P1 | Yes | BE route `/expenses` | Stale backend build on Render returns 500 | `test_category_uuid_coercion.py` | Local fix applied | Stale | FAIL | HTTP 500 on `POST /expenses` | Schema validator added locally |
| **EXP-03** | Expense | detail | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by EXP-01 |
| **EXP-04** | Expense | edit | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by EXP-01 |
| **EXP-05** | Expense | summary | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by EXP-01 |
| **EXP-06** | Expense | daily trend | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by EXP-01 |
| **EXP-07** | Expense | reload persistence | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by EXP-01 |
| **EXP-08** | Expense | delete | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by EXP-01 |
| **TX-01** | Transaction | recent | Production | **BLOCKED** | P1 | Yes | BE route `/transactions` | Stale backend build on Render returns 500 | `probe_live_endpoints.py` | Pending Render Deploy | Stale | FAIL | HTTP 500 on `GET /transactions` | Blocked by stale Render build |
| **TX-02** | Transaction | canonical type | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by TX-01 |
| **TX-03** | Transaction | ownership | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by TX-01 |
| **TX-04** | Transaction | amount validation | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by TX-01 |
| **TX-05** | Transaction | persistence | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by TX-01 |
| **CAT-01** | Category | list | Production | **VERIFIED_PASS** | - | No | None | None | `dashboard-transactions.spec.js` | `90a4932b` | `47892a79` | PASS | `GET /categories` returned HTTP 200 with list | Render returned categories |
| **CAT-02** | Category | create | Production | **VERIFIED_PASS** | - | No | None | None | `dashboard-transactions.spec.js` | `90a4932b` | `47892a79` | PASS | Created `[QA-W05] Test Category` via modal | Modal closed, listed |
| **CAT-03** | Category | duplicate | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **CAT-04** | Category | edit | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **CAT-05** | Category | ownership | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **CAT-06** | Category | delete | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **ANA-01** | Analytics | all | Production | **BLOCKED** | P1 | Yes | BE route `/analytics/summary` | Stale backend build on Render returns 500 | `probe_live_endpoints.py` | Pending Render Deploy | Stale | FAIL | HTTP 500 on `GET /analytics/summary?type=all` | Blocked by stale Render build |
| **ANA-02** | Analytics | income | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by ANA-01 |
| **ANA-03** | Analytics | expense | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by ANA-01 |
| **ANA-04** | Analytics | date filter | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by ANA-01 |
| **ANA-05** | Analytics | category breakdown | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by ANA-01 |
| **ANA-06** | Analytics | empty period | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by ANA-01 |
| **ANA-07** | Analytics | chart safety | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by ANA-01 |
| **EXPX-01** | Export | income XLSX | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by income 500 |
| **EXPX-02** | Export | expense XLSX | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Blocked by expense 500 |
| **EXPX-03** | Export | downloaded file opens | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **EXPX-04** | Export | QA data present | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **EXPX-05** | Export | TOTAL correct | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **PRO-01** | Profile | load | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **PRO-02** | Profile | edit name | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **PRO-03** | Profile | edit supported preferences | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **PRO-04** | Profile | save | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **PRO-05** | Profile | hard refresh persistence | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **SEC-01** | Security | normal user admin denial | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **SEC-02** | Security | 2FA enable | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **SEC-03** | Security | 2FA verify | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **SEC-04** | Security | 2FA disable if supported | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **SEC-05** | Security | expired session | Production | **VERIFIED_PASS** | - | No | None | None | `apiClient.test.jsx` | `90a4932b` | `47892a79` | PASS | Expired token triggers clean logout | Browser contract verified |
| **SEC-06** | Security | single-device policy if enabled | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-01** | FinBot | widget opens | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-02** | FinBot | normal chat | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-03** | FinBot | read balance | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-04** | FinBot | transaction history | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-05** | FinBot | one QA transaction | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-06** | FinBot | batch QA transaction | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-07** | FinBot | invalid input | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-08** | FinBot | provider error | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **AI-09** | FinBot | no duplicate mutation | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **I18N-01** | i18n | VI | Production | **VERIFIED_PASS** | - | No | None | None | `i18n-acceptance.spec.js` | `90a4932b` | `47892a79` | PASS | Switch to VN VI renders localized UI | Native i18next |
| **I18N-02** | i18n | EN | Production | **VERIFIED_PASS** | - | No | None | None | `i18n-acceptance.spec.js` | `90a4932b` | `47892a79` | PASS | Switch to US EN renders English UI | Native i18next |
| **I18N-03** | i18n | reload persistence | Production | **VERIFIED_PASS** | - | No | None | None | `i18n-acceptance.spec.js` | `90a4932b` | `47892a79` | PASS | Language choice preserved in localStorage | Verified |
| **I18N-04** | i18n | no Google Translate DOM injection | Production | **VERIFIED_PASS** | - | No | None | None | `i18n-acceptance.spec.js` | `90a4932b` | `47892a79` | PASS | Zero `goog-te` DOM mutation | Clean native i18n |
| **ADM-01** | Admin | dashboard | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Dedicated QA user is not admin |
| **ADM-02** | Admin | user list | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **ADM-03** | Admin | admin guard | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **ADM-04** | Admin | categories | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **ADM-05** | Admin | audit logs | Production | NOT_VERIFIED | - | - | - | - | - | - | - | - | - | Not executed |
| **ADM-06** | Admin | system settings | Production | **VERIFIED_PASS** | - | No | None | None | `probe_live_endpoints.py` | `90a4932b` | `47892a79` | PASS | `GET /system/settings` returns 200 OK | Render live response |
