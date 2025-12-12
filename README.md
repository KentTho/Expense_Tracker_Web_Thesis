# 💰 Expense Tracker - AI-Powered Personal Finance Management System

![Project Banner](path/to/your/dashboard-screenshot.png)
*(Replace this link with your actual Dashboard screenshot)*

> **Graduation Thesis - Software Engineering**
> An intelligent personal finance management system integrated with an AI Assistant (FinBot) for natural language data entry and a multi-layer security system (2FA, Single Device Mode).

## 🌟 Introduction

**Expense Tracker** addresses the common challenge of maintaining manual financial records. Instead of filling out tedious forms, users can simply chat with the **AI Chatbot (FinBot)**. The system automatically extracts transaction details and stores them in the database.

Furthermore, this project places a strong emphasis on **Security**, implementing strict industry standards such as **Two-Factor Authentication (2FA)** and **Single Device Mode** to prevent unauthorized concurrent access.

## 🚀 Key Features

### 🤖 1. AI Chatbot Assistant (FinBot)
- Powered by **Google Gemini** & **LangChain** for Natural Language Processing (NLP).
- **Auto-Extraction:** Automatically detects *Amount, Category, Note, and Date* from user messages.
- *Example:* "I just received a salary of $2000 and spent $50 on gas." -> Automatically creates 1 Income record and 1 Expense record.
- Supports generating charts and summary reports directly within the chat interface.

### 🛡️ 2. Advanced Security
- **Two-Factor Authentication (2FA):** Integrated with TOTP (Google Authenticator) to protect user accounts.
- **Single Device Mode:** A mechanism that detects and automatically logs out older sessions when a new device logs in (prevents concurrent sessions).
- **Strict Logic:** Users must verify their email before enabling 2FA, and must enable 2FA before activating Single Device Mode.

### 📊 3. Management & Analytics (Dashboard)
- **Dashboard:** Real-time tracking of Total Income, Total Expense, Net Balance, and Trend Charts (Line/Bar/Pie).
- **Transaction Management:** Create, Read, Update, and Delete (CRUD) transactions with an intuitive UI.
- **Data Export:** Export financial reports to Excel format.

### ⚙️ 4. System & Admin
- **Theme:** Customizable Dark/Light mode.
- **Admin Panel:** User management, Audit Logs viewing, and System Configuration (Maintenance Mode, Broadcast Messages).

## 🛠️ Tech Stack

| Module | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | ReactJS | Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React |
| **Backend** | Python FastAPI | SQLAlchemy, Pydantic, Uvicorn |
| **Database** | PostgreSQL | Relational Schema, Triggers, Store Procedures |
| **AI Core** | LangChain | Google Gemini Pro Integration (Generative AI) |
| **Auth & Security** | Firebase + JWT | Firebase Auth (Login), JWT (Session Management), PyOTP (2FA) |

## 📂 Project Structure

```bash
Expense-Tracker/
├── expense-tracker-be/       # Backend (FastAPI)
│   ├── app/
│   │   ├── cruds/            # Database CRUD Operations
│   │   ├── models/           # SQLAlchemy Models
│   │   ├── routes/           # API Endpoints
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── services/         # AI Service, Auth Service
│   │   └── main.py           # Entry point
│   ├── .env                  # Backend Environment Variables
│   └── requirements.txt      # Python Dependencies
│
├── expense-tracker/          # Frontend (ReactJS)
│   ├── src/
│   │   ├── components/       # UI Components (Sidebar, Chart...)
│   │   ├── pages/            # Application Pages (Dashboard, Income...)
│   │   ├── services/         # API Calls (axios/fetch)
│   │   └── App.jsx           # Main App Component
│   ├── .env                  # Frontend Environment Variables
│   └── package.json          # Node Dependencies
└── README.md
