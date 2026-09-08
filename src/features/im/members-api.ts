import { post, pagination } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";

type Session = AdminSession | null;
export type Member = {
  userID: string;
  groupID: string;
  nickname: string;
  faceURL: string;
  roleLevel: number;
  joinTime: number;
  joinSource: number;
  muteEndTime: number;
};
export type Friend = {
  friendUser: { userID: string; nickname: string; faceURL: string };
  remark: string;
};
export const searchMembers = (
  groupID: string,
  keyword: string,
  page: number,
  size: number,
  session: Session,
) =>
  post<{ total: number; members: Member[] }>(
    "im",
    "/group/get_group_member_list",
    { groupID, keyword, filter: 0, pagination: pagination(page, size) },
    session,
  );
export const inviteMembers = (groupID: string, invitedUserIDs: string[], session: Session) =>
  post("im", "/group/invite_user_to_group", { groupID, invitedUserIDs, reason: "" }, session);
export const removeMember = (groupID: string, userID: string, session: Session) =>
  post("im", "/group/kick_group", { groupID, kickedUserIDs: [userID], reason: "" }, session);
export const setMemberRole = (
  groupID: string,
  userID: string,
  roleLevel: number,
  session: Session,
) =>
  post(
    "im",
    "/group/set_group_member_info",
    { members: [{ groupID, userID, roleLevel: { value: roleLevel } }] },
    session,
  );
export const transferOwner = async (groupID: string, userID: string, session: Session) => {
  const data = await post<{ groupInfos: { ownerUserID: string }[] }>(
    "im",
    "/group/get_groups_info",
    { groupIDs: [groupID] },
    session,
  );
  return post(
    "im",
    "/group/transfer_group",
    { groupID, oldOwnerUserID: data.groupInfos[0].ownerUserID, newOwnerUserID: userID },
    session,
  );
};
export const muteMember = (
  groupID: string,
  userID: string,
  mutedSeconds: number,
  session: Session,
) => post("im", "/group/mute_group_member", { groupID, userID, mutedSeconds }, session);
export const unmuteMember = (groupID: string, userID: string, session: Session) =>
  post("im", "/group/cancel_mute_group_member", { groupID, userID }, session);
export const listFriends = (userID: string, page: number, size: number, session: Session) =>
  post<{ total: number; friendsInfo: Friend[] }>(
    "im",
    "/friend/get_friend_list",
    { userID, pagination: pagination(page, size) },
    session,
  );
export const deleteFriend = (ownerUserID: string, friendUserID: string, session: Session) =>
  post("im", "/friend/delete_friend", { ownerUserID, friendUserID }, session);
export const forceLogout = (userID: string, platformID: number, session: Session) =>
  post("im", "/auth/force_logout", { userID, platformID }, session);
