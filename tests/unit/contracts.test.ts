import axios from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import { businessResources } from "@/features/business/resources";
import { searchMessages } from "@/features/im/api";
import { post } from "@/shared/api/client";
import { RequestError } from "@/shared/api/errors";
import type { AdminSession } from "@/shared/session/model";

vi.mock("axios", () => ({ default: { post: vi.fn(), isAxiosError: () => false } }));
const session: AdminSession = {
  adminAccount: "test",
  adminToken: "admin-test",
  adminUserID: "admin-1",
  nickname: "Test",
  faceURL: "",
  level: 1,
  imUserID: "im-admin-1",
  imToken: "im-test",
};
const request = vi.mocked(axios.post);
beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({ data: { errCode: 0, data: {} } });
});

it("keeps default-friend writes on the admin API with a deduplicated ID array", async () => {
  await businessResources["business/default-friends"].create!.execute(
    { ids: "u1\nu2\nu1" },
    undefined,
    session,
  );
  expect(request).toHaveBeenCalledWith(
    "/admin-api/default/user/add",
    { userIDs: ["u1", "u2"] },
    expect.objectContaining({ headers: expect.objectContaining({ token: "admin-test" }) }),
  );
});

it("keeps user and group message queries separate and uses the IM token", async () => {
  request.mockResolvedValue({ data: { errCode: 0, data: { chatLogs: [], chatLogsNum: 0 } } });
  const filters = { sendID: "", recvID: "", sendTime: "", contentType: 0 };
  for (const sessionType of [1, 3]) await searchMessages(filters, sessionType, 2, 20, session);
  expect(request.mock.calls.map((call) => call[1])).toEqual(
    [1, 3].map((sessionType) => ({
      ...filters,
      sessionType,
      contentType: 0,
      pagination: { pageNumber: 2, showNumber: 20 },
    })),
  );
  expect(request.mock.calls[1][2]?.headers?.token).toBe("im-test");
});

it("preserves wrapped profile update fields after separating the presentation layer", async () => {
  await businessResources["business/users"].actions![0].execute(
    { nickname: "Edited", faceURL: "https://example.com/a.png", gender: "2", birth: "" },
    { userID: "u1" },
    session,
  );
  expect(request.mock.calls[0][1]).toEqual({
    userID: "u1",
    nickname: { value: "Edited" },
    faceURL: { value: "https://example.com/a.png" },
    gender: { value: 2 },
    birth: { value: 0 },
  });
});

it("does not treat an HTML response as an empty successful list", async () => {
  request.mockResolvedValue({ data: "<!doctype html>" });
  await expect(post("admin", "/default/user/search", {}, session)).rejects.toEqual(
    new RequestError("malformed"),
  );
});
