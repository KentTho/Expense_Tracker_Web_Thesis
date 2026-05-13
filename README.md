# 💰 Expense Tracker - AI-Powered Personal Finance Management System

[![Frontend Build](https://img.shields.io/badge/Frontend-React%2018-blue)](https://reactjs.org/)
[![Backend API](https://img.shields.io/badge/Backend-FastAPI-green)](https://fastapi.tiangolo.com/)
[![AI Core](https://img.shields.io/badge/AI-Gemini%20%2F%20LangChain-orange)](https://langchain.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Overview

**Expense Tracker** is a state-of-the-art personal finance management system designed for a modern user experience. It integrates an **AI-powered Chatbot (FinBot)** for natural language transaction entry and a **Military-Grade Security** layer including Two-Factor Authentication (2FA) and Single Device Mode.

This project serves as a **Software Engineering Graduation Thesis**, showcasing the integration of modern web technologies, generative AI, and robust security protocols.

---

## 🚀 Key Features

### 🤖 1. FinBot - The AI Financial Assistant
*   **Natural Language Processing:** Powered by **Google Gemini** & **LangChain 0.3**.
*   **Smart Extraction:** Automatically identifies *Amount, Category, Note, and Date* from messages like *"I just spent $50 on sushi with friends"*.
*   **Batch Processing:** Supports multiple transaction entries in a single sentence.
*   **Interactive Charts:** Generates spending reports and trend charts directly inside the chat interface using custom visualization tools.
*   **Financial Advice:** Provides personalized savings tips based on your real-world balance and statistics.

### 🛡️ 2. Advanced Multi-Layer Security
*   **Dual-Identity System:** Combines **Firebase Auth** for identity management with an **Internal JWT Service** for granular session control.
*   **Two-Factor Authentication (2FA):** TOTP integration (Google Authenticator / Authy) using `pyotp`.
*   **Single Device Mode:** Prevents concurrent sessions by invalidating older session keys when a new login occurs.
*   **Security Guardrails:** Users must verify their email before enabling 2FA, and enable 2FA before activating Single Device Mode.
*   **Emergency Support:** Integrated "SOS" request system for users who lose access to their 2FA devices.

### 📊 3. Premium Analytics & Management
*   **Home Dashboard:** High-fidelity KPIs, area charts for trends, and pie charts for category distribution.
*   **Income & Expense Modules:** Polished UI primitives with glassmorphism effects and real-time validation.
*   **Category Management:** Personalized taxonomy with support for default system categories.
*   **Data Export:** High-quality `.xlsx` export functionality for external financial audit.

### ⚙️ 4. Admin Cockpit
*   **System Pulse:** Global KPI monitoring (Total Users, 24h Growth, 2FA Adoption).
*   **Audit Logging:** Full transparency of system events and security-sensitive actions.
*   **User Management:** Administrative control over user roles, status, and security resets.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS 3 (Clean, Premium Aesthetic)
- **State & Routing:** React Router 7
- **Charts:** Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Notifications:** React Hot Toast / Toastify

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Database:** PostgreSQL
- **Caching:** Redis (with async fallback logic)
- **Auth:** Firebase Admin SDK + PyJWT
- **Security:** PyOTP (2FA), Passlib (Bcrypt)

### AI Core
- **LLM:** Google Gemini 1.5 / 2.0
- **Framework:** LangChain 0.3 (Tool-calling Agents)

---

## 📂 Repository Structure

```text
Expense-Tracker/
├── expense-tracker/          # Frontend (ReactJS)
│   ├── src/
│   │   ├── components/       # Shared UI Primitives (SectionCard, FormField...)
│   │   ├── services/         # API abstraction (api.js, authService.js...)
│   │   ├── pages/            # Feature modules (Dashboard, Security, FinBot...)
│   │   └── App.jsx           # Routing & Security Guardrails
│   └── package.json
│
├── expense-tracker-be/       # Backend (FastAPI)
│   ├── routes/               # API endpoints (Auth, Chat, Admin...)
│   ├── services/             # Business logic (FinBot AI, Auth Sync...)
│   ├── cruds/                # Database operations
│   ├── models/               # SQLAlchemy schemas
│   ├── alembic/              # Database migration history
│   └── main.py               # Application entry point
│
└── README.md                 # Unified project documentation
```

---

## ⚙️ Installation & Setup

### 1. Backend Setup
```bash
cd expense-tracker-be
python -m venv .venv
source .venv/bin/activate  # Or .\.venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
cp .env.example .env       # Configure your DB, Firebase, and Gemini keys
alembic upgrade head
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd expense-tracker
npm install
cp .env.example .env       # Configure VITE_API_URL
npm run dev
```

---

## 🔐 Auth & 2FA Flow

This project implements a unique **Pending Token** flow for maximum security:
1.  **Initial Auth:** User validates credentials via Firebase.
2.  **Handshake:** Frontend sends Firebase token to `/auth/sync`.
3.  **2FA Check:** If enabled, Backend issues a `pending_2fa` token (short-lived, no API access).
4.  **Verification:** User provides 6-digit OTP.
5.  **Access:** Backend validates OTP against the `pending_2fa` context and issues a final `access` token.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Support

For technical inquiries or access issues, please use the **Support Request** feature on the login page or contact the system administrator.

---
*Created as a Graduation Thesis for Software Engineering.*
