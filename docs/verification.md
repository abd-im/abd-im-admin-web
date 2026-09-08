# 验收记录

日期：2026-09-08。应用开发完成；本记录区分自动化验证、真实读取和上线前验收。

## 自动化

- `pnpm check`：格式、18 项单元测试、TypeScript 与生产构建、18 项 Playwright 测试。
- 单元测试覆盖国际化键/插值、分层/无循环、Token、ID 数组、包装字段、群角色、群主转让、撤回会话 ID、版本校验、通知协议和日志时间单位。
- 浏览器覆盖全部业务菜单、登录语言持久化、默认好友跨页选择、头像上传、群角色与转让、指定平台下线、消息预览/撤回、通知部分失败重试/结果未知、资料/密码、版本、会话过期、上传失败及图片/视频元数据。
- 桌面 1280 x 720 与手机 390 x 844 截图已检查，覆盖英文、深色、长表格和通知表单。截图由测试生成到 `test-results/`。
- `pnpm test:deploy`：使用本机 Nginx 通过语法、深层 SPA 路由、三类 API 前缀与 Token 转发、静态资源 404、下载文件 206 范围请求验证。测试服务与文件均位于临时目录，结束后清理。

自动化数据及写操作全部使用模拟接口。视频测试夹具为本地产生的 1 秒色块视频，不含用户数据。

## 真实服务只读核对

通过用户已提供的管理员账号登录现有服务，所有下列请求返回 HTTP 200 / errCode 0，未打印或保存 Token、密码和用户内容到仓库：

| 服务 | 已核对接口 |
| --- | --- |
| 管理 10009 | account/login、account/info、block/search、default/user/search、default/group/search、application/page_versions、application/latest_version |
| 业务 10008 | user/search/full |
| IM 10002 | user/get_users、user/get_users_online_status、friend/get_friend_list、group/get_groups、group/get_group_member_list、msg/search_msg（会话类型 1/3/4）、third/logs/search、user/search_notification_account |

已核对列表内层字段，包括好友 `friendUser`、群组 `groupInfo`、消息 `chatLog`、在线状态数组和成员身份。当前真实日志、通知账号、默认配置及版本数据存在空列表，写入正确性以本地协议和自动化结果为依据，未把空列表视为行操作验证。

另外使用本地新后台真实登录并逐页等待标题和数据加载，14 个业务页面均无请求错误或 JavaScript 异常。对应脚本 `scripts/verify-live-ui.mjs` 对允许的读取接口建立白名单，阻止业务写请求。

只读复核脚本为 `scripts/verify-live-readonly.mjs`，使用临时浏览器会话，必要时从环境变量 `ABD_AUDIT_USER` / `ABD_AUDIT_PASSWORD` 重新登录；脚本输出仅状态和字段名。凭据不放进命令历史或版本库。

## 协议差异

- 好友删除仅删除指定 owner 的关系，不发出反向删除请求。
- 群角色通过 `members` 数组和 `roleLevel.value` 更新；转让前读取当前群主。
- 群验证枚举 0/1/2，群内加好友与查看成员资料的 0 表示允许；群成员来源 1/2/3/4 对应管理员/邀请/搜索/二维码。
- 群成员与管理员创建时间按秒显示；业务生日、消息、日志和版本时间按毫秒处理。
- Markdown 消息为 118，流式消息为 143；流式预览合并初始内容与 packets。
- 原通知网页使用 `externalUrl`，当前服务协议使用 `url`，发送同时包含两个字段以兼容已部署端；图片 mixType 1、视频 mixType 2，视频附带已上传封面。
- 版本编辑使用包装字段，删除为 ID 数组。latest 是排序标记，不自动清除其他版本标记；当前桌面端仍是检查后打开安装包地址。

## 上线条件

1. 原 `/third/prometheus` 返回 302 到 `http://external_ip:13000/`。实际 `http://43.155.129.135:13000/` 返回 200，本机 `.env.local` 已用该地址；正式 HTTPS 部署需配置浏览器可访问的 HTTPS Grafana 地址和嵌入权限。
2. `http://43.155.129.135/downloads/abd-im/1.0.1/ABD-IM_1.0.1.exe` 重定向 HTTPS 后返回 404。此检查仅针对 IP 的默认站点，不能据此推断其他域名或磁盘文件不存在。需要在实际下载域名部署 `deploy/default.conf.template` 中的目录映射，然后验证大小与范围请求。
3. 尚未使用生产用户执行封禁、下线、好友删除、群变更、消息撤回或通知发送。上线前使用隔离服务或专用测试数据完成真实写入、对象存储跨域上传、投递与回执验收。
4. 版本页与客户端查询协议已核对，真实查询成功但当前无版本记录；发布测试记录后的桌面客户端提示和实际安装包下载尚未验收。
5. 当前 WSL 未启用 Docker，未执行容器构建。Dockerfile/Compose 已提供，本机 Nginx 的实际请求验证已通过；目标环境需要构建并启动容器验证。

部署步骤、新旧后台并存与回滚方式见 `deployment.md`。上述条件属于部署/联调验收，不是隐藏的前端占位模块。
