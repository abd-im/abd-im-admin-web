import { expect, test, type Page } from "@playwright/test";

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "abd_im_admin_session_v1",
      JSON.stringify({
        adminAccount: "test",
        adminToken: "admin-test",
        adminUserID: "admin-1",
        nickname: "Workspace Admin",
        faceURL: "",
        level: 1,
        imUserID: "im-admin-1",
        imToken: "im-test",
      }),
    );
    if (!localStorage.getItem("abd_admin_language"))
      localStorage.setItem("abd_admin_language", "en");
  });
  let reads = 0;
  await page.route(/\/(admin|chat|im)-api\//, (route) => {
    reads++;
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/get_groups"))
      return route.fulfill({
        json: {
          errCode: 0,
          data: {
            total: 4,
            groups: ["Product Design", "Engineering", "Customer Support", "Announcements"].map(
              (name, index) => ({
                groupInfo: {
                  groupID: `group-${index + 1}`,
                  groupName: name,
                  faceURL: "",
                  memberCount: [24, 68, 12, 148][index],
                  status: index === 3 ? 3 : 0,
                  createTime: 1788800000,
                },
                groupOwnerUserID: `owner-${index + 1}`,
              }),
            ),
          },
        },
      });
    return route.fulfill({ json: { errCode: 0, data: { total: 0, users: [], groups: [] } } });
  });
  return () => reads;
}

test("sidebar and groups collapse independently, persist, and keep page drafts", async ({
  page,
}) => {
  const reads = await setup(page);
  await page.goto("/business/default-friends");
  await expect(page.getByText("No data", { exact: true })).toBeVisible();
  await page.getByLabel("Keyword", { exact: true }).fill("kept draft");
  const initialReads = reads();
  const group = page.locator("aside").getByRole("button", { name: "Business system", exact: true });
  await group.click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.locator("aside").getByRole("link", { name: "Default friends", exact: true }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await expect.poll(async () => (await page.locator("aside").boundingBox())?.width).toBe(64);
  await expect(
    page.locator("aside").getByRole("link", { name: "Default friends", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Keyword", { exact: true })).toHaveValue("kept draft");
  expect(reads()).toBe(initialReads);
  await page.reload();
  await expect(page.getByRole("button", { name: "Expand sidebar", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
  await expect.poll(async () => (await page.locator("aside").boundingBox())?.width).toBe(244);
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await group.click();
  await expect(
    page.locator("aside").getByRole("link", { name: "Default friends", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Language", { exact: true }).selectOption("zh-CN");
  await expect(page.getByRole("button", { name: "折叠侧栏", exact: true })).toBeVisible();
});

test("mobile drawer supports Escape, outside click and navigation without changing desktop preference", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/business/default-friends");
  const toggle = page.getByRole("button", { name: "Expand sidebar", exact: true });
  const drawer = page.getByRole("dialog", { name: "Administration navigation" });
  await toggle.click();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Default groups", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.mouse.click(375, 140);
  await expect(drawer).not.toBeVisible();
  await toggle.click();
  await drawer.getByRole("link", { name: "Default groups", exact: true }).click();
  await expect(page).toHaveURL(/\/business\/default-groups$/);
  await expect(drawer).not.toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("button", { name: "Collapse sidebar", exact: true })).toBeVisible();
  await expect.poll(async () => (await page.locator("aside").boundingBox())?.width).toBe(244);
});

test("Linear surfaces and rounded controls fit desktop, collapsed and mobile layouts", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/im/groups");
  await expect(page.getByText("Product Design", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/linear-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await expect.poll(async () => (await page.locator("aside").boundingBox())?.width).toBe(64);
  await page.getByRole("button", { name: "Dark theme", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 720 });
  expect(
    await page.locator("aside .nav-scroll").evaluate((nav) => nav.scrollHeight <= nav.clientHeight),
  ).toBe(true);
  await expect(
    page.locator("aside").getByRole("link", { name: "Default groups", exact: true }),
  ).toHaveAttribute("title", "Business system: Default groups");
  await page.screenshot({
    path: "test-results/linear-collapsed-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Language", { exact: true }).selectOption("zh-CN");
  await page.getByRole("button", { name: "展开侧栏", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "test-results/linear-mobile-navigation.png", fullPage: true });
  await page.getByRole("button", { name: "关闭导航", exact: true }).click();
  await page.getByRole("button", { name: "创建群组", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "test-results/linear-mobile-form.png", fullPage: true });
});
