import { expect, test, type Page } from "@playwright/test";

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
async function authenticated(page: Page) {
  await page.addInitScript((session) => {
    localStorage.setItem("abd_im_admin_session_v1", JSON.stringify(session));
    if (!localStorage.getItem("abd_admin_language"))
      localStorage.setItem("abd_admin_language", "zh-CN");
  }, session);
}

test("login language selection updates document metadata and persists", async ({ page }) => {
  await page.goto("/login");
  await page.locator("select").selectOption("zh-CN");
  await expect(page.getByRole("heading", { name: "登录管理后台" })).toBeVisible();
  await expect(page).toHaveTitle("ABD IM 管理后台");
  await page.getByLabel("语言", { exact: true }).selectOption("en");
  await expect(page.getByRole("heading", { name: "Sign in to administration" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.getByLabel("Language", { exact: true })).toHaveValue("en");
  await page.route("**/admin-api/account/login", (route) =>
    route.fulfill({ json: { errCode: 1001, errMsg: "Invalid credentials" } }),
  );
  await page.getByLabel("Account", { exact: true }).fill("test");
  await page.getByLabel("Password", { exact: true }).fill("invalid");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Request failed (1001)");
  await page.getByLabel("Language", { exact: true }).selectOption("zh-CN");
  await expect(page.getByRole("alert")).toContainText("请求失败 (1001)");
});

test("default friends remains searchable and writable in English without language-dependent requests", async ({
  page,
}) => {
  await authenticated(page);
  let reads = 0;
  let saved: unknown;
  await page.route("**/admin-api/default/user/search", (route) => {
    reads++;
    return route.fulfill({ json: { errCode: 0, data: { total: 0, users: [] } } });
  });
  await page.route("**/chat-api/user/search/full", (route) =>
    route.fulfill({
      json: {
        errCode: 0,
        data: {
          total: 11,
          users:
            route.request().postDataJSON().pagination.pageNumber === 1
              ? [{ userID: "u1", nickname: "Alice" }]
              : [{ userID: "u2", nickname: "Bob" }],
        },
      },
    }),
  );
  await page.route("**/admin-api/default/user/add", (route) => {
    saved = route.request().postDataJSON();
    return route.fulfill({ json: { errCode: 0, data: {} } });
  });
  await page.goto("/business/default-friends");
  await expect(page.getByRole("button", { name: "添加默认好友", exact: true })).toBeVisible();
  await expect(page.getByText("暂无数据", { exact: true })).toBeVisible();
  const beforeSwitch = reads;
  await page.getByLabel("关键词", { exact: true }).fill("draft-filter");
  await page.getByLabel("语言", { exact: true }).selectOption("en");
  await expect(page.getByLabel("Keyword", { exact: true })).toHaveValue("draft-filter");
  await page.screenshot({ path: "test-results/default-friends-desktop-en.png", fullPage: true });
  await page.getByRole("button", { name: "Add default friends", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Add default friends", exact: true });
  await form.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Please enter or select Default friends.");
  await form.getByRole("button", { name: "Select users", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Default friends", exact: true });
  await picker.getByLabel("Select Alice", { exact: true }).check();
  await picker.getByRole("button", { name: "Next page", exact: true }).click();
  await picker.getByLabel("Select Bob", { exact: true }).check();
  await expect(picker.getByText("2 selected", { exact: true })).toBeVisible();
  await picker.getByRole("button", { name: "Confirm selection", exact: true }).click();
  await expect(form.getByText("u1, u2", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Select users (2)", exact: true }).click();
  await picker.getByLabel("User ID / phone number", { exact: true }).fill("u1");
  await picker.getByRole("button", { name: "Search", exact: true }).click();
  await expect(picker.getByLabel("Select Alice", { exact: true })).toBeVisible();
  expect(saved).toBeUndefined();
  await picker.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(reads).toBe(beforeSwitch);
  await form.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(form).not.toBeVisible();
  expect(saved).toEqual({ userIDs: ["u1", "u2"] });
});

test("English labels fit mobile and dark mode", async ({ page }) => {
  await authenticated(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/admin-api/default/user/search", (route) =>
    route.fulfill({ json: { errCode: 0, data: { total: 0, users: [] } } }),
  );
  await page.goto("/business/default-friends");
  await page.getByLabel("语言", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: "Dark theme", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.getByRole("heading", { name: "Default friends", exact: true })).toBeVisible();
  await expect(page.getByText("No data", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/default-friends-mobile-en.png", fullPage: true });
});
