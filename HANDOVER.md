# 创作工坊（AI Content Creator）— 项目交接文档

> 本文档面向接手此项目的 Agent 或开发者，详细描述产品功能、技术架构、当前状态、已知问题及后续建议。请在开始任何修改前完整阅读本文档。

---

## 一、产品概述

**创作工坊**是一款面向内容创作者的 AI 辅助排版工具，整体视觉风格定位为「优雅精致（Elegant & Refined）」，参考小红书用户 MM1010WT 的图文排版风格——每个页面如同一张精心设计的 PPT，图文布局考究、排版干净、视觉层次分明。

### 核心功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 产品介绍、功能入口、PPT 风格展示 |
| AI 文字编辑 | `/editor` 或 `/editor/:id` | 上传文字/图片，AI 润色/扩写/缩写/改写，富文本编辑，原文对比 |
| 表格生成 | `/table` | 输入文字数据，AI 自动生成结构化表格，支持 CSV 导出 |
| 图文排版 | `/layout` | 上传文字+图片，AI 生成 5 种排版风格的 HTML 页面，支持导出 |
| PPT 生成 | `/ppt` | 选择 6 种美学风格，AI 生成幻灯片，支持导出 HTML 演示文稿 |
| 项目管理 | `/projects` | 查看/继续编辑/删除已保存的创作项目（**需登录**） |

### 访问权限设计

**所有核心创作功能（AI 处理、上传、生成）均无需登录即可使用。** 只有「保存项目到账户」和「查看历史项目」需要登录。未登录用户点击保存时，会弹出友好的登录引导弹窗，不影响创作流程。

---

## 二、技术架构

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript + Vite |
| 样式系统 | Tailwind CSS 4 + shadcn/ui 组件库 |
| 路由 | Wouter |
| 状态/数据 | tRPC 11 + TanStack Query 5 |
| 后端框架 | Express 4 + tRPC |
| 数据库 ORM | Drizzle ORM + MySQL/TiDB |
| AI 能力 | Manus 内置 LLM（`server/_core/llm.ts` 的 `invokeLLM`） |
| 文件存储 | Manus 内置 S3（`server/storage.ts` 的 `storagePut`） |
| 认证 | Manus OAuth（`server/_core/oauth.ts`） |

### 项目目录结构

```
content-creator/
├── client/
│   └── src/
│       ├── pages/          ← 页面组件（每个功能一个文件）
│       │   ├── Home.tsx         首页
│       │   ├── Editor.tsx       AI 文字编辑器
│       │   ├── TableGen.tsx     表格生成
│       │   ├── LayoutGen.tsx    图文排版
│       │   ├── PptGen.tsx       PPT 生成
│       │   └── Projects.tsx     项目管理（需登录）
│       ├── components/
│       │   ├── MainLayout.tsx   ← 主布局（侧边栏导航）
│       │   └── ui/              ← shadcn/ui 组件库
│       ├── App.tsx              ← 路由注册
│       └── index.css            ← 全局设计系统（CSS 变量、字体）
├── server/
│   ├── routers.ts           ← 所有 tRPC API 路由（核心文件）
│   ├── db.ts                ← 数据库查询辅助函数
│   ├── storage.ts           ← S3 文件存储辅助函数
│   ├── content-creator.test.ts  ← 功能测试
│   └── _core/               ← 框架核心（勿随意修改）
│       ├── llm.ts           AI 调用入口
│       ├── env.ts           环境变量
│       ├── context.ts       tRPC 上下文（含 ctx.user）
│       └── ...
├── drizzle/
│   ├── schema.ts            ← 数据库表定义（核心文件）
│   └── *.sql                ← 已应用的迁移 SQL
└── HANDOVER.md              ← 本文档
```

---

## 三、数据库表结构

### `users` 表（框架内置）

用户账户表，由 Manus OAuth 自动管理。字段包括 `id`、`openId`、`name`、`email`、`role`（`user` | `admin`）。

### `projects` 表

存储用户的创作项目。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int PK | 自增主键 |
| `userId` | int | 关联 users.id |
| `title` | varchar(255) | 项目标题 |
| `description` | text | 项目描述（内容前 100 字） |
| `type` | enum | `article` / `table` / `layout` / `ppt` |
| `status` | enum | `draft` / `completed` |
| `content` | text | 主体内容（文章文本 / 表格 HTML / 排版 HTML / PPT slides JSON） |
| `meta` | json | 元数据（如 PPT 风格、幻灯片数量、排版风格等） |

### `uploads` 表

存储用户上传的文件元数据（实际文件存储在 S3）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int PK | 自增主键 |
| `userId` | int | 关联用户（未登录时为 0） |
| `projectId` | int nullable | 关联项目（可选） |
| `filename` | varchar | S3 存储文件名 |
| `originalName` | varchar | 用户原始文件名 |
| `mimeType` | varchar | 文件 MIME 类型 |
| `size` | int | 文件大小（字节） |
| `storageKey` | varchar | S3 存储 key |
| `storageUrl` | varchar | 可访问 URL（`/manus-storage/...`） |

### `ppt_slides` 表

存储 PPT 项目的每张幻灯片。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int PK | 自增主键 |
| `projectId` | int | 关联 projects.id |
| `slideIndex` | int | 幻灯片序号（从 0 开始） |
| `title` | varchar | 幻灯片标题 |
| `content` | text | 幻灯片文字内容 |
| `htmlContent` | text | 渲染好的 HTML/CSS 幻灯片代码 |
| `style` | varchar | 风格 key（见下方风格列表） |
| `layoutMeta` | json | 布局元数据 |

---

## 四、API 路由说明（`server/routers.ts`）

### 权限说明

- `publicProcedure`：无需登录，任何人可调用
- `protectedProcedure`：需要登录，`ctx.user` 保证非空

### AI 模块（`ai.*`）— 全部 `publicProcedure`

| 路由 | 输入 | 说明 |
|------|------|------|
| `ai.processText` | `{ text, action, customPrompt? }` | AI 文字处理。`action` 枚举：`polish`（润色）/ `expand`（扩写）/ `shorten`（缩写）/ `rewrite`（改写）/ `formal`（正式化）/ `casual`（口语化） |
| `ai.generateTable` | `{ text, tableType }` | 生成表格 HTML。`tableType`：`auto` / `comparison` / `summary` / `timeline` / `data` |
| `ai.generateLayout` | `{ text, imageUrls, layoutStyle }` | 生成图文排版 HTML。`layoutStyle`：`magazine` / `card` / `timeline` / `hero` / `grid` |
| `ai.generatePpt` | `{ text, style, slideCount, projectId? }` | 生成 PPT 幻灯片。`style` 见下方风格列表。返回 `slides[]` 数组 |
| `ai.getSlides` | `{ projectId }` | 获取已保存项目的幻灯片 |

### 上传模块（`uploads.*`）— 全部 `publicProcedure`

| 路由 | 说明 |
|------|------|
| `uploads.upload` | 上传文件（base64 编码），返回 `{ url, key, id }`。未登录时 userId=0，不持久化到 DB |
| `uploads.list` | 获取当前用户的上传文件列表 |
| `uploads.byProject` | 获取指定项目的上传文件 |

### 项目模块（`projects.*`）— 全部 `protectedProcedure`（需登录）

| 路由 | 说明 |
|------|------|
| `projects.list` | 获取当前用户的所有项目 |
| `projects.get` | 获取单个项目详情（含幻灯片） |
| `projects.create` | 创建新项目 |
| `projects.update` | 更新项目内容 |
| `projects.delete` | 删除项目 |

---

## 五、PPT 风格系统

PPT 生成支持 6 种美学风格，定义在 `server/routers.ts` 顶部的 `PPT_STYLES` 常量中，前端 `PptGen.tsx` 中同样有对应的展示配置。

| 风格 Key | 中文名 | 视觉描述 | 主色 | 背景色 |
|----------|--------|----------|------|--------|
| `coquette` | 可可特 | 粉色蕾丝蝴蝶结，浪漫少女感 | `#E8A0BF` | `#FFF0F5` |
| `dark_academia` | 暗黑学院 | 深棕暗红，复古书卷气 | `#C4A35A` | `#1C1410` |
| `cottagecore` | 田园核 | 米白花卉，温柔自然感 | `#8B7355` | `#F5F0E8` |
| `minimalism` | 极简主义 | 留白克制，高级线条感 | `#1A1A1A` | `#FAFAFA` |
| `vaporwave` | 蒸汽波 | 霓虹紫粉，赛博复古感 | `#FF71CE` | `#0D0221` |
| `bauhaus` | 包豪斯 | 几何色块，现代构成感 | `#E63946` | `#F5F5F0` |

**扩展风格时**：在 `server/routers.ts` 的 `PPT_STYLES` 对象中添加新 key，同时在 `PptGen.tsx` 的 `PPT_STYLES` 数组中添加对应展示配置，并更新 `generatePpt` 路由的 `style` 枚举校验。

---

## 六、设计系统

### 全局 CSS 变量（`client/src/index.css`）

整体采用「暖奶油 + 深棕金」配色方案：

```css
--background: oklch(0.98 0.01 85);   /* 奶油白 */
--foreground: oklch(0.2 0.04 60);    /* 深棕 */
--primary: oklch(0.45 0.08 55);      /* 棕金主色 */
--accent: oklch(0.85 0.05 30);       /* 玫瑰粉强调色 */
```

### 字体系统

```css
--font-serif: 'Playfair Display', Georgia, serif;   /* 标题字体 */
--font-body: 'Lora', Georgia, serif;                /* 正文字体 */
--font-sans: 'Inter', system-ui, sans-serif;        /* UI 字体 */
```

字体通过 Google Fonts CDN 在 `client/index.html` 中引入。

---

## 七、当前已知问题与待办

### 高优先级问题

1. **首页 CTA 按钮**：未登录时「开始创作」按钮仍引导去登录页，应改为直接跳转 `/editor`，让访客第一时间体验核心功能。相关代码在 `client/src/pages/Home.tsx`。

2. **登录按钮无响应**：`getLoginUrl()` 函数（`client/src/const.ts`）依赖 `VITE_OAUTH_PORTAL_URL` 环境变量，在本地开发环境中可能未配置导致跳转失败。生产部署后此问题会自动解决，因为 Manus 平台会自动注入该变量。

3. **未登录用户文件上传**：目前未登录用户上传的文件 `userId=0`，文件元数据不写入数据库，但文件本身已上传到 S3。如需追踪匿名上传，可考虑使用 `localStorage` 存储临时会话 ID。

### 中优先级改进

4. **PPT 导出格式**：目前仅支持导出为可在浏览器演示的 HTML 文件。可集成 `pptxgenjs` npm 包实现真正的 `.pptx` 文件导出，方便在 PowerPoint/Keynote 中使用。

5. **图文排版编辑器**：目前排版生成后只能整体重新生成，无法局部调整。可考虑添加简单的拖拽/点击编辑能力。

6. **更多 PPT 风格**：可从美学 Wiki 继续提炼风格，如 Royalcore（皇家宫廷）、Y2K（千禧复古）、Japancore（日系清冷）等。

---

## 八、开发工作流

### 本地启动

```bash
cd content-creator
pnpm install
pnpm dev          # 启动开发服务器（端口 3000）
```

### 数据库变更流程

```bash
# 1. 修改 drizzle/schema.ts
# 2. 生成迁移 SQL
pnpm drizzle-kit generate
# 3. 查看生成的 SQL 文件（drizzle/*.sql）
# 4. 通过 webdev_execute_sql 工具应用迁移（不要直接运行 migrate 命令）
```

### 运行测试

```bash
pnpm test         # 运行所有 vitest 测试
pnpm check        # TypeScript 类型检查
```

### 添加新 AI 功能的标准流程

1. 在 `server/routers.ts` 中添加新的 `publicProcedure`，使用 `invokeLLM` 调用 AI
2. 在 `server/db.ts` 中添加对应的数据库查询函数（如需持久化）
3. 在 `client/src/pages/` 中创建或更新页面组件，通过 `trpc.*.useMutation` 调用
4. 在 `client/src/App.tsx` 中注册新路由
5. 在 `client/src/components/MainLayout.tsx` 中添加侧边栏导航项
6. 在 `server/content-creator.test.ts` 中添加测试用例

---

## 九、环境变量说明

以下变量由 Manus 平台自动注入，**无需手动配置**：

| 变量名 | 用途 |
|--------|------|
| `DATABASE_URL` | MySQL/TiDB 连接字符串 |
| `JWT_SECRET` | Session cookie 签名密钥 |
| `BUILT_IN_FORGE_API_KEY` | 服务端 AI/存储 API 密钥 |
| `BUILT_IN_FORGE_API_URL` | 服务端 API 基础 URL |
| `VITE_FRONTEND_FORGE_API_KEY` | 前端 API 密钥（仅用于前端直接调用，当前项目未使用） |
| `VITE_OAUTH_PORTAL_URL` | Manus 登录门户 URL |
| `VITE_APP_ID` | OAuth 应用 ID |
| `OWNER_OPEN_ID` | 项目所有者 openId（自动提升为 admin） |

---

## 十、部署说明

本项目托管在 Manus 平台，通过平台 UI 的「Publish」按钮发布。发布前需先通过 `webdev_save_checkpoint` 创建检查点。**不支持也不需要手动部署到外部平台**（Railway、Vercel 等）。

当前最新检查点版本：`4e484fa0`

---

*文档最后更新：2026-04-27*
*编写者：Manus Agent（初始开发）*
