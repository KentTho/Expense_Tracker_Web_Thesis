# 🌐 Expense Tracker Frontend

This is the frontend application for the **Expense Tracker Web Thesis**. It is built with **React 18** and **Vite**, featuring a premium design system powered by **Tailwind CSS**.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1.  Navigate to this folder:
    ```bash
    cd expense-tracker
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    ```bash
    cp .env.example .env
    ```
    Update `VITE_API_URL` to point to your backend (default: `http://localhost:8000`).

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Quality Assurance
```bash
npm run lint
```

---

## 🎨 Design System
The frontend uses a custom-built design system with several reusable UI primitives located in `src/components/ui/`:
- **PageHeader**: Unified header with breadcrumbs and actions.
- **SectionCard**: Glassmorphism-style container for content blocks.
- **FormField**: Standardized input fields with validation states.
- **StatusBadge**: Color-coded badges for categories and types.
- **ErrorBoundary**: Safety wrapper for high-risk rendering zones.

## 🔐 Security Integration
- **Firebase Authentication**: Handles identity verification and email/password flows.
- **Internal JWT Handoff**: Synchronizes with the backend to receive internal access tokens.
- **2FA UI Step**: Implements a dedicated verification screen for TOTP codes.
- **Single Device Guard**: Detects and handles session invalidation when logged out by the backend.

## 📊 Core Modules
- **Dashboard**: High-level KPIs and financial trends.
- **FinBot (AI Chat)**: Integration with the Gemini-powered agent for natural language entries.
- **Analytics**: Deep-dive filtering and distribution charts.
- **Export**: Preview and export financial data to Excel.
- **Admin Panel**: Dedicated dashboard for system monitoring and user management.

---
*Part of the Expense Tracker Personal Finance Management System.*
