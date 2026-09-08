import { post, pagination } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";
import type {
  IMUser,
  UserFilters,
  GroupFilters,
  GroupSummary,
  UpdateGroupRequest,
  LogInfo,
  MessageFilters,
  MessageResult,
} from "./types";

type Session = AdminSession | null;
export const searchUsers = (filters: UserFilters, page: number, size: number, session: Session) =>
  post<{ users: IMUser[]; total: number }>(
    "im",
    "/user/get_users",
    { ...filters, pagination: pagination(page, size) },
    session,
  );
export const searchGroups = (filters: GroupFilters, page: number, size: number, session: Session) =>
  post<{ groups: GroupSummary[]; total: number }>(
    "im",
    "/group/get_groups",
    { ...filters, pagination: pagination(page, size) },
    session,
  );
export const createGroup = (
  request: {
    groupInfo: {
      groupName: string;
      groupType: number;
      faceURL: string;
      notification: string;
      introduction: string;
      needVerification: number;
      lookMemberInfo: number;
      applyMemberFriend: number;
    };
    ownerUserID: string;
    memberUserIDs: string[];
    adminUserIDs: string[];
  },
  session: Session,
) => post("im", "/group/create_group", request, session);
export const updateGroup = (group: UpdateGroupRequest, session: Session) =>
  post("im", "/group/set_group_info_ex", group, session);
export const muteGroup = (groupID: string, session: Session) =>
  post("im", "/group/mute_group", { groupID }, session);
export const unmuteGroup = (groupID: string, session: Session) =>
  post("im", "/group/cancel_mute_group", { groupID }, session);
export const dismissGroup = (groupID: string, session: Session) =>
  post("im", "/group/dismiss_group", { groupID }, session);
export const searchLogs = (
  keyword: string,
  range: { startTime: number; endTime: number },
  page: number,
  size: number,
  session: Session,
) =>
  post<{ logsInfos: LogInfo[]; total: number }>(
    "im",
    "/third/logs/search",
    { keyword, ...range, pagination: pagination(page, size) },
    session,
  );
export const deleteLog = (logID: string, session: Session) =>
  post("im", "/third/logs/delete", { logIDs: [logID] }, session);
export const searchMessages = (
  filters: MessageFilters,
  sessionType: number,
  page: number,
  size: number,
  session: Session,
) =>
  post<{ chatLogs: MessageResult[]; chatLogsNum: number }>(
    "im",
    "/msg/search_msg",
    { ...filters, sessionType, pagination: pagination(page, size) },
    session,
  );

export function revokeMessage(message: MessageResult["chatLog"], session: Session) {
  const { sessionType, sendID, recvID, groupID, seq } = message;
  const conversationID =
    sessionType === 3
      ? `sg_${groupID}`
      : sessionType === 2
        ? `g_${groupID}`
        : `${sessionType === 4 ? "sn" : "si"}_${[sendID, recvID].sort().join("_")}`;
  return post("im", "/msg/revoke_msg", { conversationID, seq, userID: sendID }, session);
}
