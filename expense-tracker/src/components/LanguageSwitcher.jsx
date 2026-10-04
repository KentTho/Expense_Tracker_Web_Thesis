import React from "react";
import { useTranslation } from "react-i18next";
import { changeAppLanguage } from "../i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";

  const handleLanguageChange = (langCode) => {
    changeAppLanguage(langCode);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* English button */}
      <button
        type="button"
        onClick={() => handleLanguageChange("en")}
        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
          currentLang === "en"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
        }`}
      >
        🇺🇸 EN
      </button>

      {/* Vietnamese button */}
      <button
        type="button"
        onClick={() => handleLanguageChange("vi")}
        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
          currentLang === "vi"
            ? "bg-white text-red-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
        }`}
      >
        🇻🇳 VI
      </button>
    </div>
  );
}
