import { post, pagination } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";

export type DirectoryEntry = { id: string; name: string };
export async function searchDirectory(
  group: boolean,
  keyword: string,
  page: number,
  session: AdminSession | null,
) {
  if (group) {
    const result = await post<{
      total: number;
      groups: { groupInfo: { groupID: string; groupName: string } }[];
    }>(
      "im",
      "/group/get_groups",
      { groupName: keyword, groupID: "", pagination: pagination(page, 10) },
      session,
    );
    return {
      total: result.total,
      rows: (result.groups || []).map(({ groupInfo }) => ({
        id: groupInfo.groupID,
        name: groupInfo.groupName,
      })),
    };
  }
  const result = await post<{ total: number; users: { userID: string; nickname: string }[] }>(
    "chat",
    "/user/search/full",
    { keyword, genders: 0, normal: 0, pagination: pagination(page, 10) },
    session,
  );
  return {
    total: result.total,
    rows: (result.users || []).map((user) => ({ id: user.userID, name: user.nickname })),
  };
}
