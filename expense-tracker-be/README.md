# ⚙️ Expense Tracker Backend

This is the core API for the **Expense Tracker Web Thesis**, built with **FastAPI**. It provides high-performance endpoints for financial tracking, multi-layer security, and AI-driven interactions.

## 🛠️ Requirements
- Python 3.10+
- PostgreSQL (Primary Database)
- Redis (For caching and background task support)

## 🚀 Local Setup

1.  **Virtual Environment**:
    ```powershell
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    ```
2.  **Dependencies**:
    ```powershell
    pip install -r requirements.txt
    ```
3.  **Environment Variables**:
    ```powershell
    cp .env.example .env
    ```
    Edit `.env` with your database credentials, Firebase service account (JSON string), and Gemini API key.

## 🗄️ Database Management
This system uses **Alembic** for strictly controlled migrations. **Do not** use `Base.metadata.create_all` in production.

- **Check status**: `alembic current`
- **Apply migrations**: `alembic upgrade head`
- **Create new migration**: `alembic revision --autogenerate -m "description"`

## 🏃 Run Server
```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 🧩 Core Architecture

### 🛡️ Security Engine
- **Firebase Sync**: Bridges Firebase identity with local PostgreSQL user records.
- **Dual-Token Flow**: Implements a `pending_2fa` token state to gate API access during the 2FA challenge.
- **Single Device Mode**: Tracks `session_key` to ensure only the most recent login is active.

### 🤖 FinBot (AI Service)
- **Agentic Workflow**: Uses LangChain agents with custom tools to query and mutate the database.
- **Toolbox**: Includes tools for transaction creation, history lookup, and financial analysis.
- **Cache**: Redis-backed caching for read-only financial queries to optimize LLM performance.

### 📊 Administrative Cockpit
- **Global KPIs**: Real-time aggregation of system-wide financial health and user growth.
- **Audit System**: Centralized logging for all sensitive security and administrative actions.

---
*Safety Warning: Never commit `.env` or `serviceAccountKey.json`. Keep `BACKEND_CORS_ORIGINS` strictly limited.*
