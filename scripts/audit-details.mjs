import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ storageState: '/tmp/abd-admin-audit-session.json' });
const visits = [
  ['/dashboard', []],
  ['/im/user/user_list', ['Force Offline', 'Relationship']],
  ['/im/group/group_list', ['Create Group', 'Members', 'Chat Settings']],
  ['/chat/register/default_friends', ['Add']],
  ['/chat/register/default_group', ['Add']],
  ['/im/notification/account_list', ['Add']],
];
try {
  await p.route('**/*', async route => {
    const r = route.request(); const path = new URL(r.url()).pathname;
    if (r.method() === 'POST' && !/\/(info|search|full|get_[^/]+|list|count|new_user_count|login_user_count|register|active|create)$/.test(path)) {
      console.log('BLOCKED', path); await route.abort();
    } else await route.continue();
  });
  for (const [path, actions] of visits) {
    await p.goto('http://43.155.129.135:11002' + path);
    await p.waitForTimeout(3500);
    console.log('PAGE', path, await p.locator('iframe').evaluateAll(es => es.map(e => e.src)), await p.locator('.ant-pro-layout-content').innerText());
    for (const action of actions) {
      await p.getByText(action, { exact: true }).first().click();
      await p.waitForTimeout(800);
      console.log('ACTION', action, p.url(), await p.locator('.ant-modal-content:visible,.ant-drawer-content:visible').allTextContents());
      if (new URL(p.url()).pathname !== path) {
        await p.waitForTimeout(1000);
        console.log('DETAIL PAGE', await p.locator('.ant-pro-layout-content').innerText());
        console.log('DETAIL LINKS', await p.locator('.ant-pro-layout-content a').evaluateAll(es => es.map(e => ({text:e.textContent,href:e.getAttribute('href')}))));
        await p.goto('http://43.155.129.135:11002' + path);
        await p.waitForTimeout(2000);
        continue;
      }
      console.log('TABS', await p.getByRole('tab').allTextContents());
      const close = p.locator('.ant-drawer-close:visible,.ant-modal-close:visible');
      if (await close.count()) await close.last().click();
      else await p.keyboard.press('Escape');
      await p.waitForTimeout(300);
    }
  }
} finally { await b.close(); }
