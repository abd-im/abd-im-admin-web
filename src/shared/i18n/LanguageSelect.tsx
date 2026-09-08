import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <label className="language-select" title={t("common.language")}>
      <Languages size={16} aria-hidden="true" />
      <select
        aria-label={t("common.language")}
        value={i18n.resolvedLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        <option value="zh-CN" lang="zh-CN">
          {t("languages.chinese")}
        </option>
        <option value="en" lang="en">
          {t("languages.english")}
        </option>
      </select>
    </label>
  );
}
