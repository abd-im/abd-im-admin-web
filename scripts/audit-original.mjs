import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ storageState: '/tmp/abd-admin-audit-session.json' });
const routes = ['/dashboard', '/chat/user/user_list', '/chat/user/block_list', '/chat/register/default_friends', '/chat/register/default_group', '/im/user/user_list', '/im/group/group_list', '/im/message/user_message', '/im/message/group_message', '/im/log/log_list', '/im/notification/account_list', '/im/notification/publish', '/profile/info', '/profile/modify'];
try {
  for (const route of routes) {
    const requests = [];
    const listener = request => { if (request.method() === 'POST') requests.push(new URL(request.url()).pathname); };
    page.on('request', listener);
    await page.goto('http://43.155.129.135:11002' + route);
    await page.waitForTimeout(1600);
    const main = page.locator('.ant-pro-layout-content');
    console.log(JSON.stringify({ route, url: page.url(), headings: await page.locator('h1,h2,th').allTextContents(), controls: await page.locator('button, .ant-form-item-label, .ant-table a').allTextContents(), inputs: await page.locator('input,textarea').evaluateAll(es => es.map(e => ({ placeholder: e.placeholder, type: e.type }))), requests: [...new Set(requests)], text: route.includes('publish') || route.includes('dashboard') || route.includes('modify') ? await main.innerText().catch(() => '') : undefined }));
    if (route === '/chat/user/user_list') {
      for (const name of ['Create User', 'Edit', 'Reset Password']) {
        await page.getByText(name, { exact: true }).first().click();
        await page.waitForTimeout(350);
        console.log(JSON.stringify({ route, dialog: name, labels: await page.locator('.ant-modal:visible, .ant-drawer:visible').innerText().catch(() => ''), fields: await page.locator('.ant-modal input, .ant-drawer input').evaluateAll(es => es.map(e => ({ type: e.type, placeholder: e.placeholder }))) }));
        const close = page.locator('.ant-drawer-close:visible,.ant-modal-close:visible');
        if (await close.count()) await close.first().click();
        else await page.keyboard.press('Escape');
      }
    }
    page.off('request', listener);
  }
} finally { await browser.close(); }
