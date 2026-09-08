import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const state = JSON.parse(readFileSync(process.env.ABD_AUDIT_STATE || "/tmp/abd-admin-audit-session.json", "utf8"));
const original = process.env.ABD_ORIGINAL_URL || "http://43.155.129.135:11002";
const storage = Object.fromEntries(state.origins.find(item => item.origin === original).localStorage.map(item => [item.name, item.value]));
const browser = await chromium.launch();
const page = await browser.newPage({storageState: state});
const bases = {};
page.on("request", request => {
  const url = new URL(request.url());
  if (url.pathname === "/account/info") bases.admin = url.origin;
  if (url.pathname === "/user/search/full") bases.chat = url.origin;
  if (url.pathname === "/user/get_users") bases.im = url.origin;
});
try {
  for (const route of ["/chat/user/user_list", "/im/user/user_list", "/profile/info"]) {
    await page.goto(original + route);
    await page.waitForTimeout(2000);
  }
  for (const [kind, port] of [["admin",10009],["chat",10008],["im",10002]]) {
    const fallback = new URL(original); fallback.port = String(port);
    bases[kind] ||= process.env[`ABD_${kind.toUpperCase()}_API`] || fallback.origin;
  }
  if (process.env.ABD_AUDIT_USER && process.env.ABD_AUDIT_PASSWORD) {
    const response = await page.request.post(bases.admin + "/account/login", {data:{account:process.env.ABD_AUDIT_USER,password:createHash("md5").update(process.env.ABD_AUDIT_PASSWORD).digest("hex"),version:"0.1.0"},headers:{operationID:crypto.randomUUID()}});
    const result = await response.json();
    console.log(JSON.stringify({path:"/account/login",http:response.status(),errCode:result.errCode,keys:Object.keys(result.data || {})}));
    if (result.errCode !== 0) throw new Error("Administrator login failed.");
    storage.IMAdminToken = result.data.adminToken; storage.IMAccountToken = result.data.imToken;
  }
  const request = async (kind, path, body) => {
    const response = await page.request.post(bases[kind] + path, {data: body, headers: {token: kind === "im" ? storage.IMAccountToken : storage.IMAdminToken, operationID: crypto.randomUUID()}});
    const envelope = await response.json();
    const collection = Array.isArray(envelope.data) ? envelope.data : Object.values(envelope.data || {}).find(Array.isArray);
    console.log(JSON.stringify({kind,path,http:response.status(),errCode:envelope.errCode,keys:Object.keys(envelope.data || {}),rowKeys:collection?.[0] ? Object.keys(collection[0]) : undefined}));
    if (envelope.errCode !== 0) return null;
    return envelope.data;
  };
  const pagination = {pageNumber:1,showNumber:1};
  await request("admin", "/account/info", {});
  await request("chat", "/user/search/full", {keyword:"",genders:0,normal:0,pagination});
  await request("admin", "/block/search", {keyword:"",pagination});
  await request("admin", "/default/user/search", {keyword:"",pagination});
  await request("admin", "/default/group/search", {keyword:"",pagination});
  const users = await request("im", "/user/get_users", {userID:"",nickName:"",pagination});
  if (users?.users?.[0]) {
    await request("im", "/user/get_users_online_status", {userIDs:[users.users[0].userID]});
    await request("im", "/friend/get_friend_list", {userID:users.users[0].userID,pagination});
  }
  const groups = await request("im", "/group/get_groups", {groupID:"",groupName:"",pagination});
  if (groups?.groups?.[0]) await request("im", "/group/get_group_member_list", {groupID:groups.groups[0].groupInfo.groupID,keyword:"",filter:0,pagination});
  for (const sessionType of [1,3,4]) await request("im", "/msg/search_msg", {sendID:"",recvID:"",sendTime:new Date().toISOString().slice(0,10),contentType:0,sessionType,pagination});
  await request("im", "/third/logs/search", {keyword:"",startTime:0,endTime:0,pagination});
  await request("im", "/user/search_notification_account", {keyword:"",pagination});
  await request("admin", "/application/page_versions", {platform:[],pagination});
  await request("admin", "/application/latest_version", {platform:"windows",version:"0.0.0"});
  const monitoring = await page.request.get(bases.im + "/third/prometheus", {maxRedirects:0});
  console.log(JSON.stringify({path:"/third/prometheus",http:monitoring.status(),redirect:monitoring.headers().location || null}));
} finally {await browser.close();}
