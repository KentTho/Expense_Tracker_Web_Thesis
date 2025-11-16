// AuthLayout.jsx
// - ADDED: Nền Mesh Gradient sáng tạo.
// - FIXED: Xóa nền 'bg-purple-50' thừa ở cột phải.
// - UPDATED: Di chuyển logo vào vị trí cân đối.

import logo from "../assets/logo.png";

// Để có nền Mesh Gradient, bạn cần thêm đoạn CSS này vào file index.css
/*
body.auth-background {
  background: linear-gradient(320deg, #0f172a, #2563eb, #4f46e5);
  background-size: 400% 400%;
  animation: AuthGradient 15s ease infinite;
}
@keyframes AuthGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
*/

// Thêm class 'auth-background' vào body khi ở trang này
import React, { useEffect } from 'react';

export default function AuthLayout({ children, rightContent }) {
  
  // Tự động thêm/xóa class nền
  useEffect(() => {
    document.body.classList.add('auth-background');
    return () => {
      document.body.classList.remove('auth-background');
    };
  }, []);

  return (
    // Sử dụng min-h-screen và flex để căn giữa
    <div className="min-h-screen flex items-center justify-center p-4">
      
      {/* Container chính với 2 cột */}
      <div className="w-full max-w-7xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* CỘT TRÁI (Form) */}
        <div className="flex flex-col justify-center items-center p-4">
          
          {/* ✅ Logo đã được di chuyển vào đây */}
          <div className="mb-8">
            <img src={logo} alt="App Logo" className="h-24 w-auto drop-shadow-lg" />
          </div>

          {/* Nội dung (Form Login/SignUp) */}
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* CỘT PHẢI (Hero Card) */}
        {/* ✅ Đã xóa 'bg-purple-50' và 'shadow-inner' */}
        <div className="hidden md:flex items-center justify-center h-[90vh]">
          <div className="w-[95%] h-full justify-center max-w-2xl">
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
}