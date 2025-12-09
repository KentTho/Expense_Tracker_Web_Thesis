// components/AppGuide.jsx
// - ✅ LANGUAGE: All content is now in English.
// - ✅ LOGIC: Auto-navigate to pages during the tour.
// - ✅ FIXED: Ensure tour continues seamlessly across pages.

import React from "react";
import Joyride, { STATUS, ACTIONS, EVENTS } from "react-joyride";
import { useNavigate, useLocation } from "react-router-dom"; // Import hooks
import { updateUserProfile } from "../services/profileService";

export default function AppGuide({ run, onFinish, theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate(); // Hook chuyển trang
  const location = useLocation();

  // 📝 TOUR SCRIPT (ENGLISH)
  const steps = [
    // --- STEP 0: WELCOME (Dashboard) ---
    {
      target: "body",
      placement: "center",
      title: "🎉 Welcome to Expense Tracker!",
      content: (
        <div>
          <p>Your smart personal finance assistant.</p>
          <p>Let's take a quick tour to get you started!</p>
        </div>
      ),
      disableBeacon: true,
    },
    // --- STEP 1: SIDEBAR ---
    {
      target: "#tour-sidebar",
      title: "🗂️ Navigation Menu",
      content: "This sidebar is your command center. Use it to access all features.",
      placement: "right",
    },
    // --- STEP 2: DASHBOARD OVERVIEW ---
    {
      target: "#tour-kpi",
      title: "📊 Financial Snapshot",
      content: "Instantly see your Total Income, Expenses, and Current Balance here.",
      placement: "bottom",
    },
    // --- STEP 3: ANALYTICS (Auto-navigate) ---
    {
      target: "#tour-menu-analytics",
      title: "📊 Analytics Page",
      content: "Click here to view detailed reports and charts. (Let's go there now!)",
      placement: "right",
    },
    // --- STEP 4: INCOME (Auto-navigate) ---
    {
      target: "#tour-menu-income",
      title: "💰 Income Management",
      content: "Track your earnings here. You can add salaries, bonuses, etc.",
      placement: "right",
    },
    // --- STEP 5: EXPENSE (Auto-navigate) ---
    {
      target: "#tour-menu-expense",
      title: "💸 Expense Management",
      content: "Log your daily spending here to keep track of where your money goes.",
      placement: "right",
    },
    // --- STEP 6: CATEGORY ---
    {
      target: "#tour-menu-categories",
      title: "🏷️ Custom Categories",
      content: "Create your own categories with custom colors and icons.",
      placement: "right",
    },
    // --- STEP 7: FINBOT (Back to Dashboard) ---
    {
      target: "#tour-finbot",
      title: "🤖 FinBot AI Assistant",
      content: (
        <div>
            <p>Your AI companion! Chat with FinBot to:</p>
            <ul className="list-disc pl-4 mt-2 text-sm">
                <li>Log data quickly ("Lunch 15$")</li>
                <li>Ask questions ("How much did I spend?")</li>
                <li>Generate charts ("Draw a chart for this month")</li>
            </ul>
        </div>
      ),
      placement: "top-end",
    },
  ];

  // 🔄 LOGIC ĐIỀU HƯỚNG THÔNG MINH
  const handleJoyrideCallback = async (data) => {
    const { status, type, index, action } = data;
    
    // Nếu người dùng bấm "Next" hoặc "Back"
    if (type === EVENTS.STEP_AFTER || action === ACTIONS.CLOSE) {
        
        // Logic chuyển trang dựa trên index của bước tiếp theo
        // Lưu ý: Index bắt đầu từ 0
        const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

        if (nextStepIndex === 3) { // Chuẩn bị vào bước Analytics
            navigate("/analytics");
        } else if (nextStepIndex === 4) { // Chuẩn bị vào bước Income
            navigate("/income");
        } else if (nextStepIndex === 5) { // Chuẩn bị vào bước Expense
            navigate("/expense");
        } else if (nextStepIndex === 7 || nextStepIndex === 0) { // Về lại Dashboard cho bước cuối hoặc đầu
            navigate("/dashboard");
        }
    }

    // Xử lý khi hoàn tất Tour
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      try {
        // Quay về Dashboard cho gọn
        navigate("/dashboard");
        
        // Lưu trạng thái vào DB
        await updateUserProfile({ has_onboard: true });
        
        // Tắt tour ở FE
        if (onFinish) onFinish();
      } catch (error) {
        console.error("Failed to save onboarding status", error);
        if (onFinish) onFinish();
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      // Tắt scroll tự động của thư viện để tránh xung đột với việc chuyển trang
      disableScrollParentFix={true} 
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#2563EB",
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          arrowColor: isDark ? "#1F2937" : "#FFFFFF",
          textColor: isDark ? "#F3F4F6" : "#333333",
        },
        buttonNext: {
          backgroundColor: "#2563EB",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "bold",
          color: "#FFFFFF",
          padding: "8px 16px"
        },
        buttonBack: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          marginRight: "10px"
        },
        buttonSkip: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: "14px"
        }
      }}
      locale={{
        last: "Finish",
        skip: "Skip",
        next: "Next",
        back: "Back",
      }}
    />
  );
}