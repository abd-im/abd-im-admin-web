import { chromium, expect } from "@playwright/test";

if (!process.env.ABD_AUDIT_USER || !process.env.ABD_AUDIT_PASSWORD) throw new Error("Set ABD_AUDIT_USER and ABD_AUDIT_PASSWORD for read-only UI verification.");
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const reads = new Set(["/account/login","/account/info","/user/search/full","/block/search","/default/user/search","/default/group/search","/user/get_users","/user/get_users_online_status","/group/get_groups","/msg/search_msg","/third/logs/search","/user/search_notification_account","/application/page_versions"]);
await page.route(/\/(admin|chat|im)-api\//, route => {
  const path = new URL(route.request().url()).pathname.replace(/^\/(admin|chat|im)-api/, "");
  if (!reads.has(path)) { errors.push(`Unexpected operation: ${path}`); return route.abort(); }
  return route.continue();
});
try {
  await page.goto((process.env.ABD_LOCAL_URL || "http://localhost:3102") + "/login");
  await page.locator("select").selectOption("en");
  await page.getByLabel("Account",{exact:true}).fill(process.env.ABD_AUDIT_USER);
  await page.getByLabel("Password",{exact:true}).fill(process.env.ABD_AUDIT_PASSWORD);
  await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await page.waitForURL("**/business/users");
  for (const [route, heading] of [["business/users","Business users"],["business/blocked","Blocked users"],["business/default-friends","Default friends"],["business/default-groups","Default groups"],["im/users","IM users"],["im/groups","Groups"],["im/user-messages","User messages"],["im/group-messages","Group messages"],["im/logs","Logs"],["notifications/accounts","Notification accounts"],["notifications/send","Send notification"],["applications/versions","App versions"],["account/profile","Personal information"],["account/password","Change password"]]) {
    await page.locator(`nav a[href="/${route}"]`).click();
    await expect(page).toHaveURL(new RegExp("/" + route + "$"));
    await expect(page.locator("main h1")).toHaveText(heading);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Loading…",{exact:true})).toHaveCount(0);
    const alerts = await page.getByRole("alert").count();
    console.log(JSON.stringify({route,heading:await page.locator("main h1").textContent(),alerts}));
    if (alerts) errors.push(`${route}: request error`);
  }
  if (errors.length) throw new Error(JSON.stringify(errors));
  console.log("Live UI passed: login and 14 menu pages; no business writes.");
} finally {await browser.close();}
