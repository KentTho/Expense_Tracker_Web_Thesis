import { useEffect, useState } from "react";

const LanguageSwitcher = () => {
  // State để lưu ngôn ngữ hiện tại (dựa vào cookie)
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    // 1. Nhúng script Google Translate nếu chưa có
    const addGoogleTranslateScript = () => {
      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
        
        // Hàm khởi tạo bắt buộc của Google
        window.googleTranslateElementInit = () => {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en", // Ngôn ngữ gốc của web
              includedLanguages: "en,vi", // Chỉ dịch Anh - Việt
              autoDisplay: false,
            },
            "google_translate_element"
          );
        };
      }
    };

    addGoogleTranslateScript();

    // 2. Kiểm tra cookie để set state active cho nút bấm
    const getCookie = (name) => {
      const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
      return v ? v[2] : null;
    };
    
    // Cookie của google có dạng: /auto/vi hoặc /auto/en
    const langCookie = getCookie("googtrans");
    if (langCookie && langCookie.includes("/vi")) {
      setCurrentLang("vi");
    } else {
      setCurrentLang("en");
    }
  }, []);

  // Hàm xử lý khi bấm nút chuyển ngữ
  const handleLanguageChange = (langCode) => {
    // Quy tắc cookie của Google Translate: /nguồn/đích
    // /auto/vi nghĩa là tự động nhận diện nguồn và dịch sang vi
    const cookieValue = `/auto/${langCode}`;
    
    // Set cookie cho toàn domain
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${cookieValue}; path=/`; // Fallback cho localhost

    setCurrentLang(langCode);
    
    // Reload để Google Script thực hiện dịch lại toàn trang
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Nút Tiếng Anh */}
      <button
        onClick={() => handleLanguageChange("en")}
        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
          currentLang === "en"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
        }`}
      >
        🇺🇸 EN
      </button>

      {/* Nút Tiếng Việt */}
      <button
        onClick={() => handleLanguageChange("vi")}
        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
          currentLang === "vi"
            ? "bg-white text-red-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
        }`}
      >
        🇻🇳 VI
      </button>

      {/* Div ẩn chứa widget gốc của Google (Bắt buộc phải có để script chạy) */}
      <div id="google_translate_element" style={{ display: "none" }}></div>
    </div>
  );
};

export default LanguageSwitcher;
