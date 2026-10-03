import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import viCommon from "./locales/vi/common.json";

const STORAGE_KEY = "app_language";

function getInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "vi") {
    return stored;
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    if (navigator.language.toLowerCase().startsWith("vi")) {
      return "vi";
    }
  }
  return "en";
}

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    vi: { common: viCommon },
  },
  lng: initialLang,
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLang;
}

export function changeAppLanguage(lang) {
  if (lang !== "en" && lang !== "vi") return;
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

export default i18n;
