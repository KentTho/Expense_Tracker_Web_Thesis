 // components/WelcomeSplash.jsx
// - ✅ FIXED: Dùng useEffect + setTimeout để đảm bảo luôn tự tắt sau 3.5 giây.
// - 🎨 UI: Giữ nguyên hiệu ứng đẹp.

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

export default function WelcomeSplash({ onComplete }) {
  
  // ✅ FIX LỖI: Tự động gọi onComplete sau 3.5 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3500); // Chạy animation trong 3.5s rồi tắt

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-[#0F172A] to-black text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -100, transition: { duration: 0.8 } }} // Bay lên khi tắt
    >
      <div className="relative flex flex-col items-center">
        
        <div className="flex items-center gap-4 sm:gap-6">
          {/* LOGO */}
          <motion.div
            initial={{ x: -100, opacity: 0, rotate: -180 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, duration: 1.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10">
              <Wallet size={48} className="text-white" />
            </div>
          </motion.div>

          {/* TEXT */}
          <div className="overflow-hidden">
             <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
             >
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400">
                  Expense
                </h1>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Tracker
                </h1>
             </motion.div>
          </div>
        </div>

        {/* LOADING BAR */}
        <motion.div 
            className="mt-12 h-1.5 bg-gray-800 rounded-full w-48 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
        >
            <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
            />
        </motion.div>
        
        <motion.p 
            className="mt-4 text-gray-500 text-xs font-medium tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
        >
            Starting System...
        </motion.p>

      </div>
    </motion.div>
  );
}