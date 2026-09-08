import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";
import { en } from "@/shared/i18n/locales/en";
import { zhCN } from "@/shared/i18n/locales/zh-CN";
import { resolveLanguage } from "@/shared/i18n";
import { formatTime } from "@/shared/lib/date";
import { RequestError } from "@/shared/api/errors";
import { errorMessage } from "@/shared/i18n/errorMessage";

function flatten(object: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(object).flatMap(([key, value]) =>
      typeof value === "string"
        ? [[prefix + key, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );
}

describe("translation contract", () => {
  it("keeps both languages complete with matching interpolation variables", () => {
    const english = flatten(en);
    const chinese = flatten(zhCN);
    expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort());
    for (const key of Object.keys(english)) {
      expect(chinese[key].trim(), key).not.toBe("");
      expect(chinese[key].match(/{{\w+}}/g)?.sort(), key).toEqual(
        english[key].match(/{{\w+}}/g)?.sort(),
      );
    }
  });

  it("honors a saved preference and handles unsupported browser languages", () => {
    expect(resolveLanguage("en", "zh-CN")).toBe("en");
    expect(resolveLanguage(null, "zh-TW")).toBe("zh-CN");
    expect(resolveLanguage("invalid", "fr-FR")).toBe("en");
  });

  it("translates plural counts and existing errors using the current language", async () => {
    const i18n = createInstance();
    await i18n.init({
      resources: { en: { translation: en }, "zh-CN": { translation: zhCN } },
      lng: "en",
    });
    const error = new RequestError("upload", { status: 403 });
    expect(i18n.t("common.total", { count: 1 })).toBe("1 item");
    expect(i18n.t("common.total", { count: 2 })).toBe("2 items");
    expect(errorMessage(error, i18n.t)).toBe("File upload failed (403).");
    await i18n.changeLanguage("zh-CN");
    expect(i18n.t("common.total", { count: 2 })).toBe("共 2 条");
    expect(errorMessage(error, i18n.t)).toBe("文件上传失败 (403)。");
  });

  it("formats the same timestamp for the selected locale and explicit unit", () => {
    const seconds = 1_788_800_000;
    expect(formatTime(seconds, "en", "seconds")).toBe(formatTime(seconds * 1000, "en"));
    expect(formatTime(seconds, "en", "seconds")).not.toBe(formatTime(seconds, "zh-CN", "seconds"));
    expect(formatTime("invalid", "en")).toBe("-");
  });
});
