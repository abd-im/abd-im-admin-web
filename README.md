# ABD IM Admin

使用 React、TypeScript、Vite 和 pnpm 开发的 ABD IM 管理后台。原后台管理模块与新增应用版本管理已实现，支持完整中英文和浅色/深色主题。功能范围见 [实施计划](docs/implementation-plan.md)，验证结果及上线条件见 [验收记录](docs/verification.md)。

## 本地运行

```sh
pnpm install
pnpm dev
```

默认地址为 `http://localhost:3102`。开发代理通过 `.env.local` 配置，变量见 `.env.example`：

- `ADMIN_API_TARGET`：管理服务，默认 `http://127.0.0.1:10009`。
- `CHAT_API_TARGET`：业务服务，默认 `http://127.0.0.1:10008`。
- `IM_API_TARGET`：IM 服务，默认 `http://127.0.0.1:10002`。
- `VITE_PUBLIC_IM_API_BASE`：文件上传后生成链接所用的公开 IM API 地址；默认使用当前站点的 `/im-api`。部署时必须保证此地址可被实际客户端访问。

登录页和主界面右上角支持简体中文/English，选择会保存在当前浏览器。登录使用已有管理员账号，不内置账号、密码或模拟数据。

## 开发约定

阅读 [架构与国际化规范](docs/architecture.md) 后新增模块。依赖用 `pnpm add` / `pnpm add -D` 添加；提交 `pnpm-lock.yaml`，CI 使用 `pnpm install --frozen-lockfile`。

基础 UI 使用 shadcn/ui（Radix）与 Tailwind CSS 4，组件源码位于 `src/shared/ui/`，CLI 路径由 `components.json` 配置。公共入口 `shared/ui/index.tsx` 保留后台的按钮样式、弹窗和分页接口；资源表单复用这些基础组件，业务配置仍放在各模块的 `resources.tsx`。

新增组件可执行 `pnpm dlx shadcn@latest add <组件名>`。生成后沿用 `@/shared/lib/utils` 中的 `cn`，将用户可见文案接入 i18n，并检查差异，避免覆盖已有定制。Tailwind 入口为 `src/app/styles/tailwind.css`，通过语义颜色映射复用 `tokens.css` 的深浅主题；原有 CSS 加载到 `components` 层，新组件可用工具类覆盖样式。

```sh
pnpm format
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm check
pnpm test:deploy
```

`pnpm check` 包含格式检查、架构/国际化/接口契约测试、类型检查及生产构建、浏览器回归。浏览器测试在 3103 端口启动测试服务，拦截请求，不连接生产数据。

生产输出为 `dist/`。生产部署还需要 SPA 路由回退与三个 API 代理；开发服务器的 proxy 配置不会自动进入构建产物。

提供 Docker Compose 和 Nginx 模板，具体见 [部署与更新发布](docs/deployment.md)。`pnpm test:deploy` 需要系统安装 Nginx，验证实际代理、SPA 回退和下载范围请求。当前机器的 `.env.local` 已连接现有服务，不进入仓库；页面中的写操作将作用于所配置的服务。
