import axios from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import { groupResource } from "@/features/im/group-resource";
import { setMemberRole, transferOwner, forceLogout, deleteFriend } from "@/features/im/members-api";
import { revokeMessage, searchLogs } from "@/features/im/api";
import { releaseInput } from "@/features/releases/resources";
import { updateVersion, deleteVersion } from "@/features/releases/api";
import { sendNotification } from "@/features/notifications/send-api";
import { dateRange } from "@/shared/lib/date";
import { httpURL } from "@/shared/lib/url";
import type { MessageResult } from "@/features/im/types";

vi.mock("axios", () => ({ default: { post: vi.fn(), isAxiosError: () => false } }));
const request = vi.mocked(axios.post);
beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({ data: { errCode: 0, data: {} } });
});

it("creates a group without overlapping ownership, administrator and member roles", async () => {
  await groupResource.create!.execute(
    {
      groupName: "Test",
      faceURL: "",
      notification: "",
      introduction: "",
      needVerification: "1",
      allowFriends: false,
      allowProfiles: true,
      ownerUserID: "owner",
      adminUserIDs: "owner,a",
      memberUserIDs: "a,b,b,owner",
    },
    undefined,
    null,
  );
  expect(request.mock.calls[0][1]).toEqual({
    groupInfo: {
      groupName: "Test",
      faceURL: "",
      notification: "",
      introduction: "",
      needVerification: 1,
      applyMemberFriend: 1,
      lookMemberInfo: 0,
      groupType: 2,
    },
    ownerUserID: "owner",
    adminUserIDs: ["a"],
    memberUserIDs: ["b"],
  });
});
it("updates a member role using the members array and fetches the current owner before transferring", async () => {
  await setMemberRole("g1", "u1", 60, null);
  expect(request.mock.calls[0][1]).toEqual({
    members: [{ groupID: "g1", userID: "u1", roleLevel: { value: 60 } }],
  });
  request.mockResolvedValueOnce({
    data: { errCode: 0, data: { groupInfos: [{ ownerUserID: "old" }] } },
  });
  await transferOwner("g1", "u1", null);
  expect(request.mock.calls[2][1]).toEqual({
    groupID: "g1",
    oldOwnerUserID: "old",
    newOwnerUserID: "u1",
  });
});
it("limits offline and relationship deletion to their specified targets", async () => {
  await forceLogout("u1", 3, null);
  await deleteFriend("u1", "u2", null);
  expect(request.mock.calls.map((call) => call[1])).toEqual([
    { userID: "u1", platformID: 3 },
    { ownerUserID: "u1", friendUserID: "u2" },
  ]);
});
it("uses the protocol conversation identifiers when revoking messages", async () => {
  for (const sessionType of [1, 3, 4])
    await revokeMessage(
      { sessionType, sendID: "z", recvID: "a", groupID: "g1", seq: 9 } as MessageResult["chatLog"],
      null,
    );
  expect(request.mock.calls.map((call) => call[1])).toEqual(
    ["si_a_z", "sg_g1", "sn_a_z"].map((conversationID) => ({
      conversationID,
      seq: 9,
      userID: "z",
    })),
  );
});
it("preserves false update flags and array IDs in version management", async () => {
  const input = releaseInput({
    platform: "windows",
    version: "1.0.1",
    url: "https://example.com/app.exe",
    text: "Changes",
    latest: false,
    force: false,
    hot: false,
  });
  await updateVersion("v1", input, null);
  await deleteVersion("v1", null);
  expect(request.mock.calls[0][1]).toMatchObject({
    id: "v1",
    latest: { value: false },
    force: { value: false },
    hot: { value: false },
    url: { value: "https://example.com/app.exe" },
  });
  expect(request.mock.calls[1][1]).toEqual({ id: ["v1"] });
});
it("rejects invalid versions and non-HTTP download URLs before mutation", () => {
  const values = {
    platform: "windows",
    version: "wrong",
    url: "https://example.com/a.exe",
    text: "Changes",
  };
  expect(() => releaseInput(values)).toThrow("releases.invalidVersion");
  expect(() => releaseInput({ ...values, version: "1.0.1", url: "javascript:alert(1)" })).toThrow(
    "releases.invalidURL",
  );
  expect(request).not.toHaveBeenCalled();
  expect(httpURL("javascript:alert(1)")).toBeUndefined();
});
it("sends OA notifications with explicit recipients and both deployed link field names", async () => {
  await sendNotification(
    {
      account: { userID: "n1", nickName: "Service", faceURL: "" },
      text: "Notice",
      url: "https://example.com/",
      isSendAll: false,
      recvIDs: ["u1"],
      attachment: { mixType: 0 },
    },
    null,
  );
  expect(request.mock.calls[0][1]).toMatchObject({
    isSendAll: false,
    recvIDs: ["u1"],
    sendID: "n1",
    sessionType: 4,
    contentType: 1400,
    content: {
      notificationName: "Service",
      text: "Notice",
      url: "https://example.com/",
      externalUrl: "https://example.com/",
      mixType: 0,
    },
  });
});
it("uses millisecond log date bounds including the end of the selected day", async () => {
  const range = dateRange("2026-09-01", "2026-09-02");
  expect(new Date(range.endTime).getHours()).toBe(23);
  expect(new Date(range.endTime).getMilliseconds()).toBe(999);
  expect(range.endTime - range.startTime).toBe(2 * 86400000 - 1);
  await searchLogs("u1", range, 1, 20, null);
  expect(request.mock.calls[0][1]).toMatchObject({ keyword: "u1", ...range });
  expect(() => dateRange("2026-09-02", "2026-09-01")).toThrow("management.invalidRange");
});
