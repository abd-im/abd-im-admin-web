import md5 from "blueimp-md5";
import { post } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";

export type Profile = {
  userID: string;
  account: string;
  nickname: string;
  faceURL: string;
  level: number;
  createTime: number;
};
export async function getProfile(session: AdminSession | null): Promise<Profile> {
  const { userID, account, nickname, faceURL, level, createTime } = await post<Profile>(
    "admin",
    "/account/info",
    {},
    session,
  );
  return { userID, account, nickname, faceURL, level, createTime };
}
export const updateProfile = (nickname: string, faceURL: string, session: AdminSession | null) =>
  post(
    "admin",
    "/account/update",
    { nickname: { value: nickname }, faceURL: { value: faceURL } },
    session,
  );
export const changePassword = (current: string, password: string, session: AdminSession | null) =>
  post(
    "admin",
    "/account/change_password",
    { userID: session?.adminUserID, currentPassword: md5(current), newPassword: md5(password) },
    session,
  );
