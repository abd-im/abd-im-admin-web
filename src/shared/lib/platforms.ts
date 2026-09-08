import type { TFunction } from "i18next";

const platforms: Record<number, string> = {
  1: "iOS",
  2: "Android",
  3: "Windows",
  4: "macOS",
  5: "Web",
  7: "Linux",
  8: "Android Pad",
  9: "iPad",
};
export const platformLabel = (id: number, t: TFunction) =>
  id === 6
    ? t("platformNames.miniProgram")
    : id === 10
      ? t("platformNames.admin")
      : platforms[id] || t("status.unknown", { value: id });
export type OnlineStatus = {
  userID: string;
  status: string;
  detailPlatformStatus?: { platformID: number }[];
};
export const onlinePlatforms = (status?: OnlineStatus) => [
  ...new Set(status?.detailPlatformStatus?.map((item) => item.platformID) || []),
];
