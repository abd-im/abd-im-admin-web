import { post, pagination } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";
import type { NotificationAccount } from "./types";

export const searchAccounts = (
  keyword: string,
  page: number,
  size: number,
  session: AdminSession | null,
) =>
  post<{ total: number; notificationAccounts: NotificationAccount[] }>(
    "im",
    "/user/search_notification_account",
    { keyword, pagination: pagination(page, size) },
    session,
  );
export const createAccount = (account: NotificationAccount, session: AdminSession | null) =>
  post("im", "/user/add_notification_account", { ...account, appMangerLevel: 3 }, session);
export const updateAccount = (account: NotificationAccount, session: AdminSession | null) =>
  post("im", "/user/update_notification_account", account, session);
