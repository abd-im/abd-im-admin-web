import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";

const directory = mkdtempSync(join(tmpdir(), "abd-admin-nginx-"));
const api = createServer((request, response) => {response.setHeader("Content-Type", "application/json");response.end(JSON.stringify({path:request.url,token:request.headers.token}));});
api.listen(0,"127.0.0.1"); await once(api,"listening");
const probe = createServer(); probe.listen(0,"127.0.0.1"); await once(probe,"listening");
const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
let nginx;
try {
  mkdirSync(join(directory,"downloads")); writeFileSync(join(directory,"downloads","test.exe"), Buffer.alloc(2048,1));
  let template = readFileSync("deploy/default.conf.template","utf8");
  for (const key of ["ADMIN_API_TARGET","CHAT_API_TARGET","IM_API_TARGET"]) template = template.replaceAll("${" + key + "}", `http://127.0.0.1:${api.address().port}`);
  template = template.replace("listen 80;",`listen 127.0.0.1:${port};`).replace("/usr/share/nginx/html",resolve("dist")).replace("/var/www/downloads/",join(directory,"downloads") + "/");
  const config = join(directory,"nginx.conf");
  writeFileSync(config,`pid ${directory}/nginx.pid;\nerror_log ${directory}/error.log;\nevents {}\nhttp { access_log off; include /etc/nginx/mime.types; ${template} }`);
  execFileSync("nginx",["-t","-p",directory,"-c",config],{stdio:"pipe"});
  nginx = spawn("nginx",["-p",directory,"-c",config,"-g","daemon off;"],{stdio:"ignore"});
  const origin = `http://127.0.0.1:${port}`;
  for (let attempt=0;attempt<30;attempt++) {try {await fetch(origin+"/healthz");break;} catch {await new Promise(resolve=>setTimeout(resolve,100));}}
  assert.match(await (await fetch(origin+"/im/groups/g1/members")).text(), /<div id="root"><\/div>/);
  assert.equal((await fetch(origin+"/assets/missing.js")).status,404);
  for (const prefix of ["admin","chat","im"]) {
    const result=await (await fetch(`${origin}/${prefix}-api/verify`,{method:"POST",headers:{token:"test-token"},body:"{}"})).json();
    assert.deepEqual(result,{path:"/verify",token:"test-token"});
  }
  const download=await fetch(origin+"/downloads/test.exe",{headers:{Range:"bytes=0-1023"}});
  assert.equal(download.status,206); assert.equal((await download.arrayBuffer()).byteLength,1024);
  assert.equal((await fetch(origin+"/downloads/missing.exe")).status,404);
  console.log("Nginx passed: syntax, SPA routes, 3 API prefixes and token forwarding, missing assets, download ranges.");
} finally {
  if (nginx) {nginx.kill("SIGQUIT"); await once(nginx,"exit");}
  await new Promise(resolve=>api.close(resolve)); rmSync(directory,{recursive:true,force:true});
}
