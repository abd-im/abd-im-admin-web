import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const browser = await chromium.launch();
const page = await browser.newPage({ storageState: "/tmp/abd-admin-audit-session.json" });
const output = "/tmp/abd-original-assets";
mkdirSync(output, { recursive: true });
const downloads = [];
page.on("response", response => {
  const url = new URL(response.url());
  if (url.pathname.endsWith(".js")) downloads.push(response.text().then(text => writeFileSync(`${output}/${url.pathname.split("/").pop()}`, text)).catch(() => {}));
});
try {
  for (const path of ["/im/notification/publish", "/im/message/user_message", "/im/message/group_message", "/im/group/group_list", "/im/log/log_list", "/profile/modify", "/dashboard"]) {
    await page.goto(`http://43.155.129.135:11002${path}`);
    await page.waitForTimeout(1800);
    await Promise.allSettled(downloads);
    console.log(path, "loaded");
  }
  await Promise.allSettled(downloads);
} finally { await browser.close(); }
