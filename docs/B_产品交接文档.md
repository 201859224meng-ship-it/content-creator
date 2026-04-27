# 创作工坊（AI Content Creator）产品交接文档

## 一、交接背景与目的

本文档旨在为接手「创作工坊（AI Content Creator）」项目的开发者或 Agent 提供全面的项目信息。无论您是进行日常维护、功能迭代还是架构升级，本文档都将帮助您快速理解项目的当前状态、技术栈、核心逻辑以及已知问题。

**核心问题解答：“如果我要换一个帐号接手这个项目，它会需要哪些信息？”**

接手本项目，您需要掌握以下关键信息：
1.  **项目代码库**：GitHub 仓库地址及访问权限。
2.  **技术架构与依赖**：前端、后端、数据库及 AI 服务的技术选型。
3.  **环境变量配置**：运行项目所需的各项密钥与配置项。
4.  **数据库结构**：核心数据表的设计与关联关系。
5.  **开发与部署流程**：如何在本地启动项目以及如何发布到生产环境。
6.  **当前待办与已知问题**：项目目前存在的缺陷及未来规划。

## 二、技术架构概览

创作工坊采用现代化的全栈 TypeScript 架构，前后端分离但通过 tRPC 实现类型安全的紧密结合。

### 1. 核心技术栈

| 层级 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | React 19 + TypeScript + Vite | 提供高性能的组件化开发体验与极速的构建速度。 |
| **样式系统** | Tailwind CSS 4 + shadcn/ui | 快速构建一致且美观的用户界面，支持高度定制化。 |
| **前端路由** | Wouter | 轻量级的 React 路由解决方案。 |
| **状态与数据获取** | tRPC 11 + TanStack Query 5 | 实现端到端的类型安全 API 调用与高效的客户端状态管理。 |
| **后端框架** | Express 4 + tRPC | 构建健壮的 RESTful API 与 tRPC 服务端。 |
| **数据库与 ORM** | Drizzle ORM + MySQL/TiDB | 类型安全的数据库操作，支持灵活的 Schema 定义与迁移。 |
| **AI 能力** | Manus 内置 LLM | 通过 `server/_core/llm.ts` 的 `invokeLLM` 接口调用。 |
| **文件存储** | Manus 内置 S3 | 通过 `server/storage.ts` 的 `storagePut` 接口实现文件上传与管理。 |
| **用户认证** | Manus OAuth | 通过 `server/_core/oauth.ts` 实现安全的第三方登录。 |

### 2. 项目目录结构

了解项目的目录结构是快速上手的基础：

```text
content-creator/
├── client/                 # 前端代码目录
│   └── src/
│       ├── pages/          # 页面级组件（Home, Editor, TableGen, LayoutGen, PptGen, Projects）
│       ├── components/     # 通用组件与布局（MainLayout, ui/）
│       ├── App.tsx         # 路由注册入口
│       └── index.css       # 全局样式与 CSS 变量定义
├── server/                 # 后端代码目录
│   ├── routers.ts          # 核心 tRPC API 路由定义
│   ├── db.ts               # 数据库查询辅助函数
│   ├── storage.ts          # S3 文件存储辅助函数
│   ├── content-creator.test.ts # 后端功能测试用例
│   └── _core/              # 框架核心逻辑（包含 LLM、环境变量、上下文等，建议谨慎修改）
├── drizzle/                # 数据库相关目录
│   ├── schema.ts           # 核心数据库表结构定义
│   └── *.sql               # 自动生成的数据库迁移脚本
├── HANDOVER.md             # 原始交接文档备份
└── todo.md                 # 原始待办事项列表
```

## 三、核心数据结构

项目的数据持久化依赖于关系型数据库，核心表结构定义在 `drizzle/schema.ts` 中。

### 1. `users` 表（框架内置）
由 Manus OAuth 自动管理，存储用户基本信息（`id`, `openId`, `name`, `email`, `role`）。

### 2. `projects` 表
存储用户的创作项目，是系统的核心业务表。
*   **字段**：`id` (PK), `userId` (关联 users), `title`, `description`, `type` (枚举：article/table/layout/ppt), `status` (draft/completed), `content` (主体内容), `meta` (JSON 格式的元数据)。

### 3. `uploads` 表
记录用户上传的文件元数据，实际文件存储在 S3。
*   **字段**：`id` (PK), `userId` (未登录为 0), `projectId` (可选), `filename`, `originalName`, `mimeType`, `size`, `storageKey`, `storageUrl`。

### 4. `ppt_slides` 表
专门用于存储 PPT 项目的单张幻灯片数据。
*   **字段**：`id` (PK), `projectId` (关联 projects), `slideIndex`, `title`, `content`, `htmlContent`, `style`, `layoutMeta`。

## 四、API 路由设计

所有的 API 路由均定义在 `server/routers.ts` 中，分为公开接口和受保护接口。

*   **公开接口（`publicProcedure`）**：无需登录即可调用，主要包括 AI 处理模块（`ai.processText`, `ai.generateTable`, `ai.generateLayout`, `ai.generatePpt`, `ai.getSlides`）和文件上传模块（`uploads.upload`）。
*   **受保护接口（`protectedProcedure`）**：需要用户登录（`ctx.user` 非空），主要包括项目管理模块（`projects.list`, `projects.get`, `projects.create`, `projects.update`, `projects.delete`）。

## 五、开发与部署工作流

### 1. 环境变量配置

接手项目时，无需手动配置复杂的环境变量，以下变量由 Manus 平台在运行时自动注入：
*   `DATABASE_URL`：数据库连接字符串。
*   `JWT_SECRET`：Session 签名密钥。
*   `BUILT_IN_FORGE_API_KEY` / `BUILT_IN_FORGE_API_URL`：服务端 AI 与存储 API 密钥及地址。
*   `VITE_OAUTH_PORTAL_URL` / `VITE_APP_ID`：OAuth 登录相关配置。
*   `OWNER_OPEN_ID`：项目所有者 ID（自动赋予 admin 权限）。

### 2. 本地开发指南

1.  克隆代码库并进入项目目录：`cd content-creator`
2.  安装依赖：`pnpm install`
3.  启动开发服务器：`pnpm dev`（默认运行在 3000 端口）

### 3. 数据库变更流程

当需要修改数据库表结构时，请遵循以下步骤：
1.  修改 `drizzle/schema.ts` 文件。
2.  生成迁移 SQL 脚本：`pnpm drizzle-kit generate`。
3.  检查生成的 SQL 文件（位于 `drizzle/` 目录下）。
4.  **注意**：不要直接运行 migrate 命令，需通过 `webdev_execute_sql` 工具应用迁移。

### 4. 部署说明

本项目专为 Manus 平台设计，托管与部署均在平台内完成。
*   **发布方式**：通过 Manus 平台 UI 的「Publish」按钮进行发布。
*   **版本控制**：发布前需通过 `webdev_save_checkpoint` 创建检查点。不支持手动部署到 Vercel、Railway 等外部平台。

## 六、已知问题与后续规划

接手项目后，建议优先关注以下已知问题及待办事项：

### 1. 高优先级修复
*   **首页引导优化**：目前未登录状态下，首页的「开始创作」按钮仍会引导至登录页。应修改 `client/src/pages/Home.tsx`，使其直接跳转至 `/editor`，以便访客快速体验核心功能。
*   **本地登录调试**：`getLoginUrl()` 依赖的 `VITE_OAUTH_PORTAL_URL` 在本地开发时可能缺失，导致登录跳转失败（生产环境正常）。需在本地环境提供 Mock 或配置说明。
*   **匿名上传追踪**：目前未登录用户上传的文件 `userId` 记录为 0，且不写入数据库。建议引入 `localStorage` 存储临时 Session ID，以便更好地管理匿名用户的上传记录。

### 2. 功能迭代建议
*   **PPT 导出增强**：当前仅支持导出 HTML 格式。建议集成 `pptxgenjs` 库，实现原生 `.pptx` 文件的导出功能。
*   **排版编辑器升级**：目前的图文排版生成后只能整体重做。建议增加局部编辑能力（如拖拽调整、点击修改文本）。
*   **丰富美学模板**：在现有的 6 种 PPT 风格基础上，继续扩展如 Royalcore（皇家宫廷）、Y2K（千禧复古）等新风格。
