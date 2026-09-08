import axios from "axios";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { post } from "@/shared/api/client";
import { RequestError } from "@/shared/api/errors";
import type { AdminSession } from "@/shared/session/model";
import { loadSession, saveSession, SESSION_CHANGED_EVENT } from "@/shared/session/storage";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
const request = vi.mocked(axios.post);
const session: AdminSession = {
  adminAccount: "admin",
  adminToken: "admin-valid",
  adminUserID: "a1",
  nickname: "Admin",
  faceURL: "",
  level: 1,
  imUserID: "im-admin",
  imToken: "im-old",
};
const rejected = (errCode: number) => ({ data: { errCode, errMsg: "Token rejected" } });

beforeEach(() => {
  request.mockReset();
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  vi.stubGlobal("window", new EventTarget());
  saveSession({ ...session });
});
afterEach(() => vi.unstubAllGlobals());

it.each([1501, 1502, 1503, 1504, 1505, 1506, 1507])(
  "clears the session on IM auth error %s without refreshing or retrying",
  async (code) => {
    const changed = vi.fn();
    window.addEventListener(SESSION_CHANGED_EVENT, changed);
    request.mockResolvedValue(rejected(code));
    await expect(post("im", "/user/get_users", {}, session)).rejects.toEqual(
      new RequestError("sessionExpired"),
    );
    expect(request).toHaveBeenCalledTimes(1);
    expect(loadSession()).toBeNull();
    expect(changed).toHaveBeenCalledOnce();
  },
);

it("also expires the login when the admin token is missing", async () => {
  request.mockResolvedValue(rejected(1507));
  await expect(post("admin", "/block/search", {}, session)).rejects.toEqual(
    new RequestError("sessionExpired"),
  );
  expect(loadSession()).toBeNull();
  expect(request).toHaveBeenCalledTimes(1);
});

it("preserves the session on network and business errors without replaying writes", async () => {
  const network = new Error("Network unavailable");
  request.mockRejectedValueOnce(network);
  await expect(post("im", "/msg/batch_send_msg", {}, session)).rejects.toBe(network);
  expect(request).toHaveBeenCalledTimes(1);
  request.mockReset().mockResolvedValue(rejected(1001));
  await expect(post("im", "/user/get_users", {}, session)).rejects.toMatchObject({
    reason: "server",
  });
  expect(request).toHaveBeenCalledTimes(1);
  expect(loadSession()).toEqual(session);
});

it.each([false, true])(
  "does not clear a newer login after a late auth failure (%s)",
  async (switchAccount) => {
    let finish!: (value: ReturnType<typeof rejected>) => void;
    request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = post("im", "/user/get_users", {}, session);
    const failure = expect(pending).rejects.toEqual(new RequestError("sessionExpired"));
    const next = switchAccount
      ? { ...session, adminUserID: "a2", adminToken: "admin-other" }
      : { ...session, imToken: "im-new-login" };
    saveSession(next);
    finish(rejected(1507));
    await failure;
    expect(loadSession()).toEqual(next);
    expect(request).toHaveBeenCalledTimes(1);
  },
);
