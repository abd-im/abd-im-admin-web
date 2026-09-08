# 部署与更新发布

## 与原后台并存

先使用独立端口或域名部署新后台，保留原 `11002` 入口。新旧页面连接相同服务，前端部署不执行数据库迁移。验证完成后再切换入口；回滚只需恢复旧入口或上一版静态产物。

## Docker

### GitHub Actions 镜像

工作流位于 `.github/workflows/publish-docker-image.yml`，与 Web 仓库一样手动触发：推送到 GitHub 默认分支后，在 Actions 中选择 **Publish Docker image to GHCR → Run workflow**，选择分支并填写版本标签（例如 `v0.1.0`）。

镜像使用根目录的 Dockerfile 构建，架构为 `linux/amd64`，发布到 `ghcr.io/abd-im/abd-im-admin-web`。每次生成指定版本标签和 `sha-<短提交号>`；从 `main` 运行时还会更新 `latest`。工作流使用自带的 `GITHUB_TOKEN` 和 `packages: write` 权限登录 GHCR，无需另配仓库密码。

构建成功后可拉取对应版本：

```sh
docker pull ghcr.io/abd-im/abd-im-admin-web:v0.1.0
```

如果 GHCR 包是私有的，部署机器须先登录 GHCR。下面的 Compose 配置默认从源码构建；部署已发布镜像时，将 `build: .` 替换为 `image: ghcr.io/abd-im/abd-im-admin-web:v0.1.0`，保留端口、环境变量和下载目录挂载，然后运行 `docker compose pull && docker compose up -d`。

### 本地构建

```sh
docker compose build
docker compose up -d
docker compose ps
```

默认访问 `http://服务器:3102`。容器使用宿主机 `10009` 管理服务、`10008` 业务服务和 `10002` IM 服务。后端在其他机器时，在项目 `.env` 中设置 `ADMIN_API_TARGET`、`CHAT_API_TARGET`、`IM_API_TARGET`，值不要以斜杠结尾，再重新创建容器。容器运行时通过官方 Nginx 模板替换这三个地址，不需要重建前端。

外层已有 HTTPS Nginx 时，将新域名转发到该端口。头像和附件链接使用浏览器看到的 `/im-api` 地址生成，因此该地址需要能被 IM 客户端访问；也可构建时配置 `VITE_PUBLIC_IM_API_BASE` 指向原有公网 IM API。

## 直接部署静态文件

```sh
pnpm install --frozen-lockfile
pnpm check
```

`dist/` 为可部署产物。以 `deploy/default.conf.template` 为配置依据，将 `root` 改为静态目录，将三个 `${..._API_TARGET}` 改为真实后端地址。保留代理路径末尾的 `/`，以正确剥离 `/admin-api`、`/chat-api`、`/im-api` 前缀。该模板直接交给 Nginx 前必须替换变量。执行 `nginx -t` 通过后再重载。

深层路径如 `/im/groups` 必须回退到 `index.html`；API 和不存在的静态资源不能回退为 HTML。`index.html` 不长期缓存，带哈希的 `/assets/` 可以缓存。

## 安装包下载

已有文件：

```text
/var/www/downloads/abd-im/1.0.1/ABD-IM_1.0.1.exe
```

模板将 `/downloads/` 映射到 `/var/www/downloads/`。对应管理后台版本记录：

```text
平台: windows
版本: 1.0.1
安装包地址: https://你的域名/downloads/abd-im/1.0.1/ABD-IM_1.0.1.exe
```

Docker Compose 已只读挂载此目录。Nginx 进程需要目录遍历和文件读取权限，不需要写权限。新版本放在新目录，保留旧包；上传完毕并确认完整后再添加版本记录。

发布前检查下载返回 `200`、大小与文件一致，以及范围请求返回 `206`：

```sh
curl -I https://你的域名/downloads/abd-im/1.0.1/ABD-IM_1.0.1.exe
curl -I -H 'Range: bytes=0-1023' https://你的域名/downloads/abd-im/1.0.1/ABD-IM_1.0.1.exe
```

桌面自动更新复用现有版本表单及 chat 的 `/application/latest_version`。本期 `windows` 对应 x64，`mac` 对应 arm64，不新增架构或更新目录字段。新包放在 `/downloads/abd-im/<platform>/<arch>/<version>/`，安装包名使用构建输出的 `_x64.exe` 或 `_arm64.dmg`。客户端从安装包所在目录读取 `latest.yml` 或 `latest-mac.yml`，Mac 目录还必须有 `_arm64.zip`。清单使用 `no-cache`，不存在的文件返回 404。

上传并验收完成后，通过原页面新增版本，通常设置 `latest=true`、`hot=false`、`force=false`。保存后记录就可能被客户端选中，没有独立草稿或发布状态。`latest=false` 仅降低排序优先级，不代表未发布；测试包不要登记到正式版本列表。原接口按优先标记和记录 ID 选一条记录，客户端再比较 SemVer，不会遍历记录寻找最高版本。

不需要新的 chat 版本接口、服务端下载允许列表或数据库迁移。删除错误记录或调整优先标记只影响后续查询，不能撤回已下载的客户端候选包，也不会降级。发布目录不得覆盖，修复使用更高版本号。旧客户端仍通过同一记录获取安装包，首次安装带更新器的版本后才具备自动安装能力。

构建、签名、上传脚本及两平台真实升级验收步骤见相邻 `abd-im-web` 仓库的 `docs/desktop-auto-update-implementation.md`。当前自动化浏览器测试使用模拟接口，尚未向正式站点发布安装包。

## 登录凭据失效

后台登录包含 `adminToken` 和 `imToken` 两套凭据，管理登录仍有效不代表 IM Token 一直存在。接口返回 `1501` 至 `1507` 的鉴权错误（包括 Token 过期、不存在或被踢出）时，前端清除登录状态并返回登录页，不自动刷新 Token 或重试原请求。退出状态同步到已打开的其他标签页。

`abd-im-chat` 的管理员登录接口直接向 IM 服务获取 Token，绕过进程内旧 Token 缓存，避免重新登录后仍拿到已失效的凭据。本次处理不新增刷新接口，无需数据库迁移。

网络超时或普通业务错误保留登录状态，不自动重放写操作。切换账号或重新登录后，旧请求返回的鉴权错误不能清除新的会话。

## 监控与存储

监控默认访问 IM `/third/prometheus`，服务端重定向到其配置的 Grafana。可用 `VITE_MONITORING_URL` 指定可从浏览器访问的 Grafana。Grafana 的登录和 iframe 嵌入限制由 Grafana 配置决定，页面提供独立打开入口。

头像、群头像和通知附件复用 IM 对象存储签名表单上传。对象存储必须允许后台域名跨域 POST，并提供浏览器可访问的签名 URL。视频上传包含视频文件和封面图片。

## 替换前联调

自动化写操作测试全部使用模拟接口。在隔离环境完成测试账号创建、编辑、封禁/解封、群成员和身份变更、通知投递、密码修改、上传下载及客户端版本查询后，再切换原入口。不要拿生产用户和群作为破坏性操作的回归数据。只读联调结果与尚未执行项见 `verification.md`。
