import { post } from "./client";
import type { AdminSession } from "@/shared/session/model";
import type { OnlineStatus } from "@/shared/lib/platforms";

export const onlineStatus = (userIDs: string[], session: AdminSession | null) =>
  post<OnlineStatus[]>("im", "/user/get_users_online_status", { userIDs }, session);
