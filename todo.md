# AI 内容创作平台 - TODO

## 数据库 & 后端
- [x] 设计 projects / slides / uploads 数据表 Schema
- [x] 实现文件上传 API（图片 + 文字，存储到 S3）
- [x] 实现 AI 文字处理 API（润色/扩写/缩写/改写）
- [x] 实现表格生成 API（AI 结构化文字为表格数据）
- [x] 实现图文排版生成 API（AI 生成排版 HTML）
- [x] 实现 PPT 内容生成 API（多风格模板）
- [x] 实现项目 CRUD API（保存/读取/删除项目）

## UI 框架 & 设计系统
- [x] 设计全局 CSS 变量（优雅精致色系：米白/金/深棕/玫瑰）
- [x] 构建主导航布局（侧边栏 + 移动端适配）
- [x] 构建首页 Landing Page（功能入口 + 风格展示）
- [x] 构建项目列表页（历史记录）

## 核心功能页面
- [x] 内容上传页：拖拽上传文字和图片，批量导入
- [x] AI 文字处理页：选择处理模式，预览对比，手动编辑
- [x] 富文本编辑器：精细编辑 AI 处理后的内容
- [x] 表格生成页：上传文字数据 → 自动生成结构化表格
- [x] 图文排版页：文字 + 图片 → 精美图文页面预览
- [x] PPT 生成页：选择风格模板 → 生成 PPT 内容 → 导出

## PPT 风格模板（6 种）
- [x] Coquette（粉色蕾丝蝴蝶结，浪漫少女）
- [x] Dark Academia（深棕暗红，复古书卷）
- [x] Cottagecore（米白花卉，温柔自然）
- [x] Minimalism（留白克制，高级线条）
- [x] Vaporwave（霓虹紫粉，赛博复古）
- [x] Bauhaus（几何色块，现代构成）

## 测试 & 交付
- [x] 编写 vitest 单元测试（6 个测试全部通过）
- [x] 整合调试所有功能
- [x] 保存检查点并交付

## 无需登录直接使用（新需求）
- [x] 后端 AI 处理接口改为 publicProcedure（无需登录）
- [x] 后端文件上传接口改为 publicProcedure
- [x] 后端表格生成接口改为 publicProcedure
- [x] 后端图文排版生成接口改为 publicProcedure
- [x] 后端 PPT 生成接口改为 publicProcedure
- [x] 前端 Editor 页面移除登录限制
- [x] 前端 TableGen 页面移除登录限制
- [x] 前端 LayoutGen 页面移除登录限制
- [x] 前端 PptGen 页面移除登录限制
- [x] 项目保存功能：未登录时提示登录后保存，已登录正常保存

## GitHub 推送 & 交接文档（新需求）
- [ ] 编写完整项目交接文档 HANDOVER.md
- [ ] 为核心文件添加代码注释
- [ ] 推送代码到用户 GitHub 仓库
