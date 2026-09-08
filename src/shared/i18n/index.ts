import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";

export const LANGUAGE_KEY = "abd_admin_language";
export const supportedLanguages = ["zh-CN", "en"] as const;
export type Language = (typeof supportedLanguages)[number];
type LeafKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafKeys<T[K]>}`;
}[keyof T & string];
export type TranslationKey = LeafKeys<typeof en>;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
    strictKeyChecks: true;
  }
}

export function resolveLanguage(stored: string | null, browserLanguage: string): Language {
  if (stored === "zh-CN" || stored === "en") return stored;
  return browserLanguage.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

export async function initializeI18n() {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LANGUAGE_KEY);
  } catch {
    /* Storage can be disabled by the browser. */
  }
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, "zh-CN": { translation: zhCN } },
    lng: resolveLanguage(stored, navigator.language),
    fallbackLng: "en",
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
  });
  const syncDocument = (language: string) => {
    document.documentElement.lang = language;
    document.title = i18n.t("app.title");
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* Language switching still works without persistence. */
    }
  };
  syncDocument(i18n.language);
  i18n.on("languageChanged", syncDocument);
}

export { i18n };
