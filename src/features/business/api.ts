import { post, pagination } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";
import type {
  BusinessUser,
  BlockedUser,
  DefaultFriend,
  DefaultGroup,
  CreateUserRequest,
  UpdateUserRequest,
} from "./types";

type Session = AdminSession | null;
type UserList = { total: number; users: BusinessUser[] };
export const searchUsers = (keyword: string, page: number, pageSize: number, session: Session) =>
  post<UserList>(
    "chat",
    "/user/search/full",
    { keyword, genders: 0, normal: 0, pagination: pagination(page, pageSize) },
    session,
  );
export const searchBlocked = (keyword: string, page: number, pageSize: number, session: Session) =>
  post<{ total: number; users: BlockedUser[] }>(
    "admin",
    "/block/search",
    { keyword, pagination: pagination(page, pageSize) },
    session,
  );
export const searchDefaultFriends = (
  keyword: string,
  page: number,
  pageSize: number,
  session: Session,
) =>
  post<{ total: number; users: DefaultFriend[] }>(
    "admin",
    "/default/user/search",
    { keyword, pagination: pagination(page, pageSize) },
    session,
  );
export const searchDefaultGroups = (
  keyword: string,
  page: number,
  pageSize: number,
  session: Session,
) =>
  post<{ total: number; groups: DefaultGroup[] }>(
    "admin",
    "/default/group/search",
    { keyword, pagination: pagination(page, pageSize) },
    session,
  );
export const createUser = (user: CreateUserRequest, session: Session) =>
  post("admin", "/account/add_user", { user }, session);
export const updateUser = (user: UpdateUserRequest, session: Session) =>
  post("chat", "/user/update", user, session);
export const blockUser = (userID: string, reason: string, session: Session) =>
  post("admin", "/block/add", { userID, reason }, session);
export const unblockUser = (userID: string, session: Session) =>
  post("admin", "/block/del", { userIDs: [userID] }, session);
export const resetPassword = (userID: string, newPassword: string, session: Session) =>
  post("admin", "/user/password/reset", { userID, currentPassword: "", newPassword }, session);
export const addDefaultFriends = (userIDs: string[], session: Session) =>
  post("admin", "/default/user/add", { userIDs }, session);
export const removeDefaultFriend = (userID: string, session: Session) =>
  post("admin", "/default/user/del", { userIDs: [userID] }, session);
export const addDefaultGroups = (groupIDs: string[], session: Session) =>
  post("admin", "/default/group/add", { groupIDs }, session);
export const removeDefaultGroup = (groupID: string, session: Session) =>
  post("admin", "/default/group/del", { groupIDs: [groupID] }, session);
