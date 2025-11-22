// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./locales/en/translation.json";
import translationVI from "./locales/vi/translation.json";

const resources = {
  en: { translation: translationEN },
  vi: { translation: translationVI },
};

i18n
  .use(LanguageDetector) // Tự động phát hiện ngôn ngữ (localStorage)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en", // Nếu không tìm thấy ngôn ngữ thì dùng tiếng Anh
    interpolation: {
      escapeValue: false, // React đã tự xử lý XSS
    },
  });

export default i18n;