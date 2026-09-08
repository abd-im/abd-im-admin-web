import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";

const session = {
  adminAccount: "test",
  adminToken: "admin-test",
  adminUserID: "admin-1",
  nickname: "Test Admin",
  faceURL: "",
  level: 1,
  imUserID: "im-admin-1",
  imToken: "im-test",
};
const user = {
  userID: "u1",
  nickname: "Alice",
  faceURL: "",
  gender: 1,
  phoneNumber: "12345678",
  birth: 0,
};
const group = {
  groupID: "g1",
  groupName: "Project Team",
  faceURL: "",
  memberCount: 2,
  status: 0,
  createTime: 1788800000,
  notification: "Welcome",
  introduction: "",
  needVerification: 0,
  applyMemberFriend: 0,
  lookMemberInfo: 0,
};
const account = { userID: "n1", nickName: "Service", faceURL: "" };
type Call = { path: string; body: Record<string, unknown> };
async function setup(page: Page) {
  const calls: Call[] = [];
  await page.addInitScript((session) => {
    if (!sessionStorage.getItem("test-session-seeded")) {
      localStorage.setItem("abd_im_admin_session_v1", JSON.stringify(session));
      sessionStorage.setItem("test-session-seeded", "1");
    }
    localStorage.setItem("abd_admin_language", "en");
  }, session);
  await page.route(/\/(admin|chat|im)-api\//, (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON() || {};
    calls.push({ path, body });
    let data: unknown = {};
    if (path.endsWith("/get_users") || path.endsWith("/user/search/full"))
      data = { users: [user], total: 1 };
    else if (path.endsWith("/get_users_online_status"))
      data = [
        {
          userID: "u1",
          status: "online",
          detailPlatformStatus: [{ platformID: 3 }, { platformID: 5 }],
        },
      ];
    else if (path.endsWith("/get_groups"))
      data = { groups: [{ groupInfo: group, groupOwnerUserID: "owner" }], total: 1 };
    else if (path.endsWith("/get_group_member_list"))
      data = {
        members: [
          { ...user, roleLevel: 20, joinSource: 4, muteEndTime: 0 },
          { userID: "owner", nickname: "Owner", roleLevel: 100, joinSource: 1, muteEndTime: 0 },
        ],
        total: 2,
      };
    else if (path.endsWith("/get_groups_info"))
      data = { groupInfos: [{ ...group, ownerUserID: "owner" }] };
    else if (path.endsWith("/get_friend_list"))
      data = { friendsInfo: [{ friendUser: user }], total: 1 };
    else if (path.endsWith("/search_notification_account"))
      data = { notificationAccounts: [account], total: 1 };
    else if (path.endsWith("/account/info"))
      data = {
        account: "test",
        userID: "admin-1",
        nickname: "Test Admin",
        faceURL: "",
        createTime: 1788800000,
        level: 1,
      };
    else if (path.endsWith("/page_versions"))
      data = {
        versions: [
          {
            id: "v1",
            platform: "windows",
            version: "1.0.1",
            url: "https://example.com/a.exe",
            text: "First release",
            latest: true,
            force: false,
            hot: false,
            createTime: 1788800000000,
          },
        ],
        total: 1,
      };
    else if (path.endsWith("/logs/search"))
      data = {
        logsInfos: [
          {
            logID: "l1",
            userID: "u1",
            nickname: "Alice",
            systemType: "Windows",
            platform: 3,
            version: "1.0.1",
            filename: "log.zip",
            ex: "",
            url: "https://example.com/log.zip",
            createTime: 1788800000000,
          },
        ],
        total: 1,
      };
    else if (path.endsWith("/default/group/search")) data = { groups: [group], total: 1 };
    else if (path.endsWith("/default/user/search"))
      data = { users: [{ userID: "u1", user }], total: 1 };
    else if (path.endsWith("/block/search"))
      data = {
        users: [{ ...user, reason: "Test", opUserID: "admin-1", createTime: 1788800000 }],
        total: 1,
      };
    else if (path.endsWith("/search_msg"))
      data = {
        chatLogs: [
          {
            chatLog: {
              clientMsgID: "m1",
              sendID: "u1",
              recvID: body.sessionType === 3 ? "g1" : "u2",
              groupID: body.sessionType === 3 ? "g1" : "",
              senderNickname: "Alice",
              recvNickname: "Bob",
              groupName: "Project Team",
              sessionType: body.sessionType,
              contentType: 101,
              content: JSON.stringify({ content: "Hello world" }),
              seq: 7,
              sendTime: 1788800000000,
            },
            isRevoked: false,
          },
        ],
        chatLogsNum: 1,
      };
    return route.fulfill({ json: { errCode: 0, data } });
  });
  return calls;
}

test("all original menus load real controls without missing routes in both languages", async ({
  page,
}) => {
  await setup(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "business/users",
    "business/blocked",
    "business/default-friends",
    "business/default-groups",
    "im/users",
    "im/groups",
    "im/user-messages",
    "im/group-messages",
    "im/logs",
    "notifications/accounts",
    "notifications/send",
    "applications/versions",
    "account/profile",
    "account/password",
  ];
  await page.goto("/business/users");
  for (const path of routes) {
    await page.locator(`nav a[href="/${path}"]`).click();
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page not found" })).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  await page.getByLabel("Language", { exact: true }).selectOption("zh-CN");
  await expect(page.getByRole("heading", { name: "修改密码", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("business edit uploads an avatar and submits wrapped values", async ({ page }) => {
  const calls = await setup(page);
  await page.route("**/im-api/object/initiate_form_data", (route) =>
    route.fulfill({
      json: {
        errCode: 0,
        data: {
          id: "upload1",
          url: "https://storage.example.com/upload",
          file: "file",
          formData: { key: "avatar" },
          successCodes: [204],
        },
      },
    }),
  );
  await page.route("https://storage.example.com/upload", (route) => route.fulfill({ status: 204 }));
  await page.route("**/im-api/object/complete_form_data", (route) =>
    route.fulfill({ json: { errCode: 0, data: { url: "https://example.com/avatar.png" } } }),
  );
  await page.goto("/business/users");
  await page.getByRole("button", { name: "Edit user", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit user" });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7WQAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(dialog.getByRole("img")).toHaveAttribute("src", "https://example.com/avatar.png");
  await dialog.getByLabel("Nickname", { exact: true }).fill("Updated Alice");
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(calls.find((call) => call.path.endsWith("/user/update"))?.body).toMatchObject({
    userID: "u1",
    nickname: { value: "Updated Alice" },
    faceURL: { value: "https://example.com/avatar.png" },
  });
});

test("group member actions preserve owner restrictions and transfer from the current owner", async ({
  page,
}) => {
  const calls = await setup(page);
  await page.goto("/im/groups/g1/members");
  const owner = page.getByRole("row").filter({ hasText: "owner" });
  await expect(owner.getByRole("button", { name: "Remove member" })).toHaveCount(0);
  const alice = page.getByRole("row").filter({ hasText: "Alice" });
  await expect(alice).toContainText("QR code");
  await alice.getByRole("button", { name: "Set role" }).click();
  const role = page.getByRole("dialog", { name: "Set role" });
  await role.getByLabel("Role", { exact: true }).selectOption("60");
  await role.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(role).not.toBeVisible();
  expect(calls.find((call) => call.path.endsWith("/set_group_member_info"))?.body).toEqual({
    members: [{ groupID: "g1", userID: "u1", roleLevel: { value: 60 } }],
  });
  await alice.getByRole("button", { name: "Transfer ownership" }).click();
  const transfer = page.getByRole("dialog", { name: "Transfer ownership" });
  await expect(transfer).toContainText("current owner will lose ownership");
  await transfer.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(transfer).not.toBeVisible();
  expect(calls.find((call) => call.path.endsWith("/transfer_group"))?.body).toEqual({
    groupID: "g1",
    oldOwnerUserID: "owner",
    newOwnerUserID: "u1",
  });
});

test("force offline only submits the selected platform", async ({ page }) => {
  const calls = await setup(page);
  await page.goto("/im/users");
  await expect(
    page.getByRole("columnheader", { name: "Online sessions", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Windows / Web", exact: true }).click();
  await expect(page).toHaveURL(/\/im\/users\/u1\/sessions$/);
  await page
    .getByRole("row")
    .filter({ hasText: "Windows" })
    .getByRole("button", { name: "Force offline" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Disconnect u1 on Windows?");
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(calls.find((call) => call.path.endsWith("/force_logout"))?.body).toEqual({
    userID: "u1",
    platformID: 3,
  });
});

for (const failed of [false, true]) {
  test(`platform column distinguishes ${failed ? "unavailable status" : "offline users"}`, async ({
    page,
  }) => {
    await setup(page);
    await page.route("**/get_users_online_status", (route) =>
      route.fulfill({
        json: failed ? { errCode: 500, errMsg: "unavailable" } : { errCode: 0, data: [] },
      }),
    );
    await page.goto("/im/users");
    const row = page.getByRole("row").filter({ hasText: "Alice" });
    await expect(
      row.getByRole("cell", { name: failed ? "Unable to load data" : "Offline", exact: true }),
    ).toBeVisible();
    await expect(row.locator('a[href$="/sessions"]')).toHaveCount(0);
  });
}

test("message views keep session filters separate and revoke the selected message", async ({
  page,
}) => {
  const calls = await setup(page);
  await page.goto("/im/user-messages");
  await expect(page.getByText("Hello world", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Revoke message", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(calls.find((call) => call.path.endsWith("/revoke_msg"))?.body).toEqual({
    conversationID: "si_u1_u2",
    seq: 7,
    userID: "u1",
  });
  await page.locator('nav a[href="/im/group-messages"]').click();
  await expect(page.getByLabel("Group ID", { exact: true })).toBeVisible();
  await expect(page.getByText("Hello world", { exact: true })).toBeVisible();
  expect(calls.filter((call) => call.path.endsWith("/search_msg")).at(-1)?.body.sessionType).toBe(
    3,
  );
});

test("all-user notification retries only explicitly failed users", async ({ page }) => {
  await setup(page);
  const sends: Record<string, unknown>[] = [];
  await page.route("**/im-api/msg/batch_send_msg", (route) => {
    sends.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        errCode: 0,
        data:
          sends.length === 1
            ? { results: [{ recvID: "u1" }], failedUserIDs: ["u2"] }
            : { results: [{ recvID: "u2" }], failedUserIDs: [] },
      },
    });
  });
  await page.goto("/notifications/send");
  await page.getByRole("radio").check();
  await page.getByLabel("All registered users", { exact: true }).check();
  await page.getByLabel("Message content", { exact: false }).fill("Scheduled maintenance");
  await page.getByLabel("Link (optional)", { exact: true }).fill("https://example.com/maintenance");
  await page.getByRole("button", { name: "Review notification" }).click();
  const dialog = page.getByRole("dialog", { name: "Confirm notification" });
  await expect(dialog).toContainText("all registered users");
  expect(sends).toHaveLength(0);
  await dialog.getByRole("button", { name: "Send notification", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("u2");
  await page.getByRole("button", { name: "Retry failed recipients" }).click();
  await dialog.getByRole("button", { name: "Send notification", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Sent to 2 users.");
  expect(sends[0]).toMatchObject({
    isSendAll: true,
    recvIDs: [],
    content: { text: "Scheduled maintenance", url: "https://example.com/maintenance" },
  });
  expect(sends[1]).toMatchObject({ isSendAll: false, recvIDs: ["u2"] });
});

test("profile updates the shell and password confirmation prevents invalid submission", async ({
  page,
}) => {
  const calls = await setup(page);
  await page.goto("/account/profile");
  await page.getByLabel("Nickname", { exact: true }).fill("New Admin");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".profile-name")).toHaveText("New Admin");
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.locator('nav a[href="/account/password"]').click();
  await page.getByLabel("Current password", { exact: true }).fill("old-pass");
  await page.getByLabel("New password", { exact: true }).fill("new-pass");
  await page.getByLabel("Confirm new password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Passwords do not match.");
  expect(calls.some((call) => call.path.endsWith("/change_password"))).toBe(false);
  await page.getByLabel("Confirm new password", { exact: true }).fill("new-pass");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const body = calls.find((call) => call.path.endsWith("/change_password"))!.body;
  expect(body.currentPassword).toMatch(/^[a-f0-9]{32}$/);
  expect(body.newPassword).toMatch(/^[a-f0-9]{32}$/);
  expect(await page.evaluate(() => localStorage.getItem("abd_im_admin_session_v1"))).toBeNull();
});

test("version controls retain native validation, empty filters, and responsive themes", async ({
  page,
}) => {
  const calls = await setup(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/applications/versions");
  await page.getByLabel("Platform", { exact: true }).selectOption("windows");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect
    .poll(() => calls.filter((call) => call.path.endsWith("/page_versions")).at(-1)?.body.platform)
    .toEqual(["windows"]);
  await page.getByLabel("Platform", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect
    .poll(() => calls.filter((call) => call.path.endsWith("/page_versions")).at(-1)?.body.platform)
    .toEqual([]);
  await expect(page.getByLabel("Go to page", { exact: true })).toHaveCSS("width", "66px");
  const trigger = page.getByRole("button", { name: "Add version", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Add version", exact: true });
  await expect(dialog.getByLabel("Platform", { exact: true })).toHaveValue("windows");
  await expect(dialog.getByLabel("Latest priority", { exact: true })).toHaveCount(1);
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog.getByLabel("Version", { exact: true })).toBeFocused();
  expect(calls.some((call) => call.path.endsWith("/add_version"))).toBe(false);
  await dialog.getByLabel("Version", { exact: true }).fill("1.2.3");
  await dialog.getByLabel("Installer URL", { exact: true }).fill("https://example.com/app.exe");
  await dialog.getByLabel("Release notes", { exact: true }).fill("Improve notification delivery.");
  await dialog.getByLabel("Force-update flag", { exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(
    dialog.getByRole("checkbox", { name: "Force-update flag", exact: true }),
  ).toBeChecked();
  for (const [width, dark] of [
    [1440, false],
    [390, true],
    [320, true],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .locator("html")
      .evaluate((element, dark) => element.classList.toggle("dark", dark), dark);
    await expect(dialog).toHaveCSS("opacity", "1");
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `test-results/shadcn-version-${width}.png`,
      animations: "disabled",
    });
  }
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(calls.find((call) => call.path.endsWith("/add_version"))?.body).toMatchObject({
    platform: "windows",
    version: "1.2.3",
    force: true,
    latest: true,
    hot: false,
  });
});

test("version dialog blocks dismissal and changes while a save is pending", async ({ page }) => {
  await setup(page);
  let finish = () => {};
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let writes = 0;
  await page.route("**/update_version", async (route) => {
    writes++;
    await pending;
    await route.fulfill({ json: { errCode: 0, data: {} } });
  });
  await page.goto("/applications/versions");
  await page.getByRole("button", { name: "Edit version", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit version", exact: true });
  try {
    await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(
      dialog.getByRole("checkbox", { name: "Force-update flag", exact: true }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Platform", { exact: true })).toBeDisabled();
    await expect(dialog.getByLabel("Version", { exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toBeVisible();
    expect(writes).toBe(1);
  } finally {
    finish();
  }
  await expect(dialog).not.toBeVisible();
});

test("nested dialogs return keyboard focus without dismissing the parent", async ({ page }) => {
  await setup(page);
  await page.goto("/business/default-friends");
  const trigger = page.getByRole("button", { name: "Add default friends", exact: true });
  await trigger.click();
  const parent = page.getByRole("dialog", { name: "Add default friends", exact: true });
  const select = parent.getByRole("button", { name: "Select users", exact: true });
  await select.click();
  const picker = page.getByRole("dialog", { name: "Default friends", exact: true });
  await expect(picker).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(picker).not.toBeVisible();
  await expect(parent).toBeVisible();
  await expect(select).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(parent).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("version form validates semantic versions and preserves disabled flags", async ({ page }) => {
  const calls = await setup(page);
  await page.goto("/applications/versions");
  await page.getByRole("button", { name: "Edit version", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit version" });
  await dialog.getByLabel("Version", { exact: true }).fill("invalid");
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("semantic version");
  await dialog.getByLabel("Version", { exact: true }).fill("1.0.2");
  await dialog.getByLabel("Latest priority", { exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(calls.find((call) => call.path.endsWith("/update_version"))?.body).toMatchObject({
    id: "v1",
    version: { value: "1.0.2" },
    latest: { value: false },
    force: { value: false },
    hot: { value: false },
  });
});

test("populated desktop and mobile dark pages fit and display the ABD IM brand", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/im/groups");
  await expect(page.getByText("Project Team", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/groups-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Dark theme", exact: true }).click();
  await page.locator('nav a[href="/notifications/send"]').click();
  await expect(page.getByRole("radio")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/notification-mobile-dark.png", fullPage: true });
});

test("unknown notification delivery never offers a blind retry", async ({ page }) => {
  await setup(page);
  let sends = 0;
  await page.route("**/im-api/msg/batch_send_msg", (route) => {
    sends++;
    return route.abort("failed");
  });
  await page.goto("/notifications/send");
  await page.getByRole("radio").check();
  await page.getByLabel("All registered users", { exact: true }).check();
  await page.getByLabel("Message content", { exact: false }).fill("Notice");
  await page.getByRole("button", { name: "Review notification" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Send notification", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Delivery could not be confirmed");
  await expect(
    dialog.getByRole("button", { name: "Send notification", exact: true }),
  ).toBeDisabled();
  expect(sends).toBe(1);
});

test("upload failure allows selecting a new file and never submits an incomplete avatar", async ({
  page,
}) => {
  const calls = await setup(page);
  await page.route("**/im-api/object/initiate_form_data", (route) =>
    route.fulfill({ json: { errCode: 1001, errMsg: "Storage unavailable" } }),
  );
  await page.goto("/business/users");
  await page.getByRole("button", { name: "Edit user", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .locator('input[type="file"]')
    .setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from([1, 2, 3]) });
  await expect(dialog.getByRole("alert")).toContainText("Storage unavailable");
  await expect(dialog.getByRole("button", { name: "Upload", exact: true })).toBeEnabled();
  expect(calls.some((call) => call.path.endsWith("/user/update"))).toBe(false);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test("message previews render images, files, markdown and safe unknown content", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/im-api/msg/search_msg", (route) =>
    route.fulfill({
      json: {
        errCode: 0,
        data: {
          chatLogs: [
            {
              contentType: 102,
              content: { sourcePicture: { url: "https://example.com/image.png" } },
            },
            {
              contentType: 105,
              content: { fileName: "report.pdf", sourceUrl: "https://example.com/report.pdf" },
            },
            { contentType: 118, content: { content: "**Formatted message**" } },
            {
              contentType: 1400,
              content: {
                detail: JSON.stringify({ text: "Notice text", url: "javascript:alert(1)" }),
              },
            },
          ].map((item, index) => ({
            chatLog: {
              clientMsgID: `m${index}`,
              sendID: "u1",
              recvID: "u2",
              senderNickname: "Alice",
              sessionType: 1,
              seq: index + 1,
              contentType: item.contentType,
              content: JSON.stringify(item.content),
              sendTime: 1788800000000,
            },
            isRevoked: false,
          })),
          chatLogsNum: 4,
        },
      },
    }),
  );
  await page.goto("/im/user-messages");
  await expect(page.getByRole("img", { name: "Image", exact: true })).toHaveAttribute(
    "src",
    "https://example.com/image.png",
  );
  await expect(page.getByRole("link", { name: "report.pdf", exact: true })).toHaveAttribute(
    "href",
    "https://example.com/report.pdf",
  );
  await expect(page.locator("strong").filter({ hasText: "Formatted message" })).toBeVisible();
  await expect(page.getByText("Notice text", { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
});

test("session expiry removes cached identity and returns to login", async ({ page }) => {
  await setup(page);
  await page.route("**/im-api/user/get_users", (route) =>
    route.fulfill({ json: { errCode: 1501, errMsg: "Expired" } }),
  );
  await page.goto("/im/users");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("abd_im_admin_session_v1"))).toBeNull();
  await expect(page.getByText("Test Admin", { exact: true })).toHaveCount(0);
});

test("missing IM token clears the session and returns to login without refreshing", async ({
  page,
}) => {
  await setup(page);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.route("**/im-api/user/get_users", (route) => {
    return route.fulfill({
      json: { errCode: 1507, errMsg: "TokenNotExistError" },
    });
  });
  await page.goto("/im/users");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("abd_im_admin_session_v1"))).toBeNull();
  expect(requests.filter((url) => url.endsWith("/im-api/user/get_users"))).toHaveLength(1);
  expect(requests.some((url) => url.includes("refresh_im_token"))).toBe(false);
});

for (const kind of ["image", "video"] as const)
  test(`notification ${kind} upload produces complete media metadata`, async ({ page }) => {
    await setup(page);
    const files: Record<string, { name: string; contentType: string }> = {};
    let submitted: Record<string, unknown> | undefined;
    await page.route("**/im-api/object/initiate_form_data", (route) => {
      const id = String(Object.keys(files).length + 1);
      files[id] = route.request().postDataJSON();
      return route.fulfill({
        json: {
          errCode: 0,
          data: {
            id,
            url: "https://storage.example.com/upload",
            file: "file",
            formData: {},
            successCodes: [204],
          },
        },
      });
    });
    await page.route("https://storage.example.com/upload", (route) =>
      route.fulfill({ status: 204 }),
    );
    await page.route("**/im-api/object/complete_form_data", (route) =>
      route.fulfill({
        json: {
          errCode: 0,
          data: { url: `https://example.com/${route.request().postDataJSON().id}` },
        },
      }),
    );
    await page.route("**/im-api/msg/batch_send_msg", (route) => {
      submitted = route.request().postDataJSON();
      return route.fulfill({ json: { errCode: 0, data: { results: [], failedUserIDs: [] } } });
    });
    await page.goto("/notifications/send");
    await page.getByRole("radio").check();
    await page.getByLabel("All registered users", { exact: true }).check();
    await page.getByLabel("Message content", { exact: false }).fill("Media notice");
    const input = page.locator('input[type="file"]');
    if (kind === "image")
      await input.setInputFiles({
        name: "image.png",
        mimeType: "image/png",
        buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 1, height: 1 } }),
      });
    else await input.setInputFiles(resolve("tests/fixtures/clip.mp4"));
    await expect(
      page.getByText(kind === "image" ? "image.png" : "clip.mp4", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Review notification" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Send notification", exact: true })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    if (kind === "image")
      expect(submitted?.content).toMatchObject({
        mixType: 1,
        pictureElem: {
          sourcePicture: { width: 1, height: 1, type: "image/png", url: "https://example.com/1" },
        },
      });
    else
      expect(submitted?.content).toMatchObject({
        mixType: 2,
        videoElem: {
          duration: 1,
          snapshotWidth: 32,
          snapshotHeight: 32,
          snapshotUrl: "https://example.com/1",
          videoUrl: "https://example.com/2",
          videoType: "video/mp4",
        },
      });
    expect(Object.keys(files)).toHaveLength(kind === "image" ? 1 : 2);
  });
