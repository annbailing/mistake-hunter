# 错题猎人 (Mistake Hunter) - 产品需求文档

> 版本：v2.0 | 日期：2026-05-31 | 作者：annbailing
>
> 当前状态：**MVP 全部模块已实现，前端 10 页面、后端 8 模块完整运行**

---

## 一、产品概述

### 1.1 产品定位

AI 驱动的智能错题管理系统，帮助学生从"记录错题"升级为"消灭弱点"。

核心闭环：**录入错题 → AI 分析错因 → 生成变体题 → 遗忘曲线复习 → 薄弱点可视化**

### 1.2 目标用户

| 用户角色 | 描述 |
|----------|------|
| 学生（主要用户） | 初高中及大学生，有系统性复习和错题管理需求 |
| 家长（次要用户） | 查看孩子学习薄弱点报告，辅助监督学习 |
| 教师（次要用户） | 查看班级整体错题分布，调整教学重点 |

### 1.3 核心价值主张

- 不只是记录错题，而是**分析错因 + 生成变体题 + 智能复习**，形成完整学习闭环
- AI 驱动的知识薄弱点可视化，让学生知道"该补什么"
- 艾宾浩斯遗忘曲线提醒（1/2/4/7/15 天），科学安排复习节奏
- 多模型 AI 抽象层：支持 OpenAI / Claude / 智谱 (Zhipu) 热切换

### 1.4 竞品分析

| 维度 | 传统错题本App | 错题猎人 |
|------|---------------|----------|
| 错题录入 | 手动拍照保存 | 拍照 OCR 自动识别 + 手动输入 |
| 错因分析 | 无 | AI 自动分析并分类（5类错因） |
| 变体题 | 无 | AI 自动生成 3 道同类变体练习题 |
| 知识地图 | 无 | 可视化知识薄弱点地图（树形结构+颜色热力） |
| 复习计划 | 固定间隔提醒 | 艾宾浩斯遗忘曲线智能提醒 |
| 进步追踪 | 无 | 多维度进步趋势图（折线/饼图/柱状图） |
| 多模型切换 | — | OpenAI / Claude / 智谱 可插拔 |

---

## 二、功能模块总览

| 模块编号 | 模块名称 | 优先级 | 状态 | 说明 |
|----------|----------|--------|------|------|
| M1 | 用户系统 | P0 | ✅ 完成 | 手机号+密码注册登录，JWT 鉴权，深色模式 |
| M2 | 错题录入 | P0 | ✅ 完成 | 拍照 OCR + 手动输入，支持 Markdown+LaTeX |
| M3 | 错题管理 | P0 | ✅ 完成 | 列表/搜索/多维筛选/编辑/删除/批量删除 |
| M4 | AI 错因分析 | P0 | ✅ 完成 | 5 类错因自动分析，前端饼图统计 |
| M5 | 变体题生成 | P1 | ✅ 完成 | AI 生成 3 道同类题，前端 KaTeX 渲染，支持在线作答评判 |
| M6 | 知识薄弱点地图 | P1 | ✅ 完成 | 按章节+标签展示薄弱点热力图 |
| M7 | 智能复习计划 | P1 | ✅ 完成 | 艾宾浩斯遗忘曲线（1/2/4/7/15 天），今日复习任务 |
| M8 | 学习统计 | P2 | ✅ 完成 | 仪表盘摘要卡片 + 趋势折线图 + 错因饼图 + 科目柱状图 |
| M9 | 科目管理 | P0 | ✅ 完成 | 9 个预置学科 + 自定义学科 + 二级章节结构 |
| M10 | AI 题目识别 | P1 | 🔜 待开发 | OCR 后自动提取题干/选项/正确答案结构 |

---

## 三、用户故事 (User Stories)

### M1 用户系统

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-1.1 | 作为学生，我想通过手机号注册账号 | ✅ |
| US-1.2 | 作为学生，我想通过手机号+密码登录 | ✅ |
| US-1.3 | 作为学生，我想编辑个人资料 | ✅ |

### M2 错题录入

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-2.1 | 作为学生，我想拍照录入错题（OCR识别） | ✅ |
| US-2.2 | 作为学生，我想手动输入错题（Markdown+LaTeX） | ✅ |
| US-2.3 | 作为学生，我想给错题添加标签 | ✅ |
| US-2.4 | 作为学生，我想标记错题的来源和日期 | ✅ |

### M3 错题管理

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-3.1 | 作为学生，我想查看错题列表（分页） | ✅ |
| US-3.2 | 作为学生，我想搜索和筛选错题（关键词/科目/标签/时间/错因） | ✅ |
| US-3.3 | 作为学生，我想编辑已录入的错题 | ✅ |
| US-3.4 | 作为学生，我想删除错题（单条+批量） | ✅ |
| US-3.5 | 作为学生，我想查看错题完整详情（含AI分析+变体题） | ✅ |

### M4 AI 错因分析

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-4.1 | 作为学生，我想让 AI 分析错因（5类：概念/计算/审题/遗忘/方法） | ✅ |
| US-4.2 | 作为学生，我想查看错因分布统计（饼图） | ✅ |

### M5 变体题生成

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-5.1 | 作为学生，我想生成 3 道同类变体练习题 | ✅ |
| US-5.2 | 作为学生，我想在线作答变体题并查看评判结果 | ✅ |

### M6 知识薄弱点地图

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-6.1 | 作为学生，我想看到知识薄弱点可视化（颜色热力） | ✅ |
| US-6.2 | 作为学生，我想按科目查看薄弱点树形结构 | ✅ |

### M7 智能复习计划

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-7.1 | 作为学生，我想按遗忘曲线收到复习提醒 | ✅ |
| US-7.2 | 作为学生，我想标记错题已掌握 | ✅ |

### M8 学习统计

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-8.1 | 作为学生，我想看到学习进步趋势 | ✅ |
| US-8.2 | 作为学生，我想看到今日学习摘要 | ✅ |

### M9 科目管理

| ID | 用户故事 | 状态 |
|----|----------|------|
| US-9.1 | 作为学生，我想管理学科（预置9科+自定义） | ✅ |
| US-9.2 | 作为学生，我想给学科添加二级章节 | ✅ |

---

## 四、非功能性需求

| 维度 | 要求 | 实际实现 |
|------|------|----------|
| 性能 | 页面加载 < 2s，OCR < 5s，AI 分析 < 10s | ✅ 前端路由懒加载 + 代码分割 |
| 并发 | 支持 100 并发用户 | ⚠️ 当前 SQLite 单机，生产需迁移 PostgreSQL |
| 安全 | 密码加密、JWT、输入校验、SQL注入防护 | ✅ bcrypt(rounds=12) + JWT(2h+7d) + helmet + express-validator + Prisma参数化 |
| 兼容性 | 响应式设计，PC+平板+手机 | ✅ TailwindCSS 响应式 + 深色模式 |
| 可用性 | 界面简洁，符合学生使用习惯 | ✅ 骨架屏 + Toast通知 + 确认弹窗 |
| 限流 | API 限流，AI 接口额外限制 | ✅ express-rate-limit（全局+AI专用） |

---

## 五、技术栈（实际实现）

### 5.1 前端（client/）

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React 18 + TypeScript | ^5.5.4 |
| 构建工具 | Vite 5 | ^5.4.0 |
| CSS 框架 | TailwindCSS 3 | ^3.4.9 |
| 路由 | react-router-dom v6（懒加载+代码分割） | ^6.26.0 |
| 状态管理 | zustand（含 localStorage 持久化） | ^4.5.4 |
| HTTP 客户端 | axios（拦截器自动处理 token/401） | ^1.7.4 |
| 图表 | recharts | ^2.12.7 |
| 公式渲染 | KaTeX（行内+块级 LaTeX） | ^0.16.11 |
| Markdown 渲染 | react-markdown | ^9.0.1 |
| 图标 | lucide-react | ^0.441.0 |
| 通知 | react-hot-toast | ^2.4.1 |
| 日期处理 | dayjs | ^1.11.12 |
| XSS 防护 | dompurify | ^3.4.7 |

### 5.2 后端（server/）

| 类别 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js + TypeScript | ^5.3.3 |
| Web 框架 | Express 4 | ^4.18.2 |
| ORM | Prisma Client | ^5.10.0 |
| 数据库 | SQLite（开发）/ PostgreSQL（生产迁移指南已就绪） | — |
| 认证 | JWT (jsonwebtoken + bcryptjs, rounds=12) | ^9.0.2 |
| 输入校验 | express-validator + zod | ^7.0.1 |
| 文件上传 | multer（最多5张，限10MB，类型白名单） | ^1.4.5-lts.1 |
| OCR | Tesseract.js（本地识别，免费） | ^5.0.4 |
| 安全头 | helmet | ^8.2.0 |
| 限流 | express-rate-limit | ^8.5.2 |
| 日志 | winston | ^3.11.0 |
| 环境变量 | dotenv | ^16.4.1 |
| 测试 | vitest + supertest | ^4.1.7 |

### 5.3 AI 集成层

| 特性 | 说明 |
|------|------|
| **可插拔架构** | 统一 `AIService` 类，支持 OpenAI / Claude / 智谱 (Zhipu) 三模型 |
| **接入协议** | OpenAI 兼容：`POST /v1/chat/completions`；Claude：`POST /v1/messages` |
| **模型配置** | `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` / `AI_BASE_URL` 环境变量 |
| **三项能力** | ① 错因分析（5类自动归类） ② 变体题生成（3道+解析） ③ 答案评判（正确/错误） |
| **容错机制** | JSON/文本双格式解析，LaTeX 转义修复，知识点关键词约束防止偏题 |
| **Claude 适配** | 独立处理 `x-api-key` 头 + Anthropic 消息格式 + thinking 模式识别 |

### 5.4 项目结构（实际目录）

```
mistake-hunter/
├── client/                          # 前端 (React 18 + Vite 5)
│   └── src/
│       ├── pages/                   # 10 个页面（全部懒加载）
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── MistakeListPage.tsx
│       │   ├── MistakeCreatePage.tsx
│       │   ├── MistakeDetailPage.tsx
│       │   ├── MistakeEditPage.tsx
│       │   ├── ReviewPage.tsx
│       │   ├── KnowledgeMapPage.tsx
│       │   ├── StatisticsPage.tsx
│       │   ├── SubjectManagePage.tsx
│       │   └── ProfilePage.tsx
│       ├── components/              # 通用 + UI + 布局组件
│       │   ├── MainLayout.tsx       # 侧边栏+顶栏布局
│       │   ├── ErrorBoundary.tsx    # 全局错误边界
│       │   └── ui/                  # Loading/Pagination 等基础组件
│       ├── services/                # API 调用层（7个模块API封装）
│       ├── stores/                  # zustand 状态（auth + app）
│       ├── types/                   # TypeScript 类型定义
│       └── hooks/                   # 自定义 Hooks
├── server/                          # 后端 (Express 4 + Prisma)
│   ├── prisma/
│   │   └── schema.prisma            # 11 个数据模型（User→ReviewSchedule）
│   └── src/
│       ├── controllers/             # 8 个控制器（auth/mistake/subject/tag/review/stats/ocr/variant）
│       ├── services/                # 业务逻辑层（含完整事务处理）
│       ├── routes/                  # 8 个路由模块（含 express-validator 校验）
│       ├── middlewares/             # 4 个中间件（auth/validate/rateLimiter/errorHandler）
│       ├── utils/                   # 工具（AI服务/OCR/logger/jsonExtractor）
│       └── config/                  # 配置（database/env/index）
└── docs/                            # 项目文档
    ├── prd/PRD.md                   # 产品需求文档（本文档）
    ├── architecture/architecture.md # 系统架构设计（含 API 规范+Mermaid 图）
    ├── database/database-design.md  # 数据库设计（ER图+DDL+索引）
    ├── design/ui-design.md          # UI/UX 设计（Token+页面原型+组件树）
    └── operations/postgresql-migration.md  # PostgreSQL 迁移指南
```

---

## 六、数据模型

基于 Prisma ORM，共 11 个模型，SQLite 当前，PostgreSQL 兼容：

```
User ──┬── Subject ──┬── Chapter（自引用树形结构）
       │              └── Mistake ──┬── MistakeImage（OCR图片）
       │                            ├── MistakeTag ── Tag
       │                            ├── AiAnalysis（一对一错因分析）
       │                            ├── VariantQuestion ── VariantAnswer
       │                            └── ReviewSchedule（遗忘曲线复习）
       ├── Tag
       ├── VariantAnswer
       └── ReviewSchedule
```

关键设计决策：
- `Mistake` 与 `AiAnalysis` 一对一（每道错题一次分析）
- `Mistake` 与 `VariantQuestion` 一对多（每道错题最多3道变体题）
- `ReviewSchedule` 按艾宾浩斯曲线自动生成 5 轮复习记录（1/2/4/7/15天）
- `Chapter` 自引用支持二级章节树（章→节）
- 所有删除操作级联处理，标签关联通过 `MistakeTag` 中间表

---

## 七、当前进度与已知限制

### 7.1 各模块实现状态

| 模块 | 状态 | 代码量（估算） | 备注 |
|------|------|---------------|------|
| M1 用户系统 | ✅ 完成 | ~500 行 | 注册/登录/个人信息/密码修改 |
| M2 错题录入 | ✅ 完成 | ~600 行 | 手动+OCR，Multer图片上传（最多5张） |
| M3 错题管理 | ✅ 完成 | ~800 行 | CRUD+搜索+多维筛选+分页+批量删除 |
| M4 AI错因分析 | ✅ 完成 | ~400 行 | 三模型可插拔，JSON/文本双格式解析 |
| M5 变体题生成 | ✅ 完成 | ~500 行 | AI生成+在线作答+评判，KaTeX渲染 |
| M6 知识薄弱点地图 | ✅ 完成 | ~300 行 | 按章节/标签聚合展示 |
| M7 智能复习计划 | ✅ 完成 | ~400 行 | 艾宾浩斯5轮，今日任务+日历 |
| M8 学习统计 | ✅ 完成 | ~400 行 | 仪表盘+趋势+错因分布+科目对比 |
| M9 科目管理 | ✅ 完成 | ~400 行 | 预置9科+自定义+二级章节 |
| M10 AI题目识别 | 🔜 待开发 | — | OCR后自动提取题目结构 |
| **总计** | — | **~4300 行** | 不含 node_modules 和自动生成代码 |

### 7.2 已知技术债务

| # | 问题 | 优先级 | 影响 | 计划 |
|---|------|--------|------|------|
| 1 | 数据库 SQLite → PostgreSQL 迁移 | **高** | 并发能力、生产可用性 | 迁移指南已就绪，需执行 |
| 2 | 无 Redis 缓存层 | 中 | 重复查询性能 | 当前 SQLite 单机可接受，多用户后加 |
| 3 | 变体题 AI 输出格式不稳定 | 中 | 偶发解析失败 | 已做 JSON/文本双格式容错 + LaTeX 转义修复 |
| 4 | 测试覆盖不足 | **高** | 代码质量保证 | vitest + supertest 环境已搭建，需编写用例 |
| 5 | 无 Docker 容器化 | 中 | 环境一致性 | 需编写 Dockerfile + docker-compose |
| 6 | 无 CI/CD 流水线 | 低 | 自动化程度 | 后续 GitHub Actions |
| 7 | OCR 中文识别精度 | 中 | 拍照录入体验 | Tesseract.js 中文精度有限，可考虑接入百度OCR |

---

## 八、路线图

### 已完成（v1.0 ~ v2.0）
- [x] 全栈 TypeScript 项目骨架
- [x] 用户认证系统（JWT + bcrypt）
- [x] 错题 CRUD + 批量操作
- [x] OCR 拍照识别（Tesseract.js）
- [x] AI 错因分析（多模型可插拔）
- [x] 变体题生成 + 在线作答
- [x] 知识薄弱点地图
- [x] 艾宾浩斯遗忘曲线复习
- [x] 学习统计仪表盘
- [x] 科目+章节管理
- [x] 响应式设计 + 深色模式
- [x] 项目文档四件套（PRD/架构/数据库/UI设计）

### 短期（v2.1）
- [ ] 单元测试 + API 集成测试
- [ ] PostgreSQL 实际迁移执行
- [ ] AI 题目结构识别（M10）
- [ ] 变体题难度自适应调整

### 中期（v3.0）
- [ ] Docker 容器化部署
- [ ] Redis 缓存层
- [ ] PWA 离线支持
- [ ] 移动端 App（React Native）

---

## 九、参考文档索引

| 文档 | 路径 | 内容 |
|------|------|------|
| 架构设计 | `docs/architecture/architecture.md` | 系统架构图、API 接口规范、技术选型、安全设计 |
| 数据库设计 | `docs/database/database-design.md` | ER 图、11 张表 DDL、索引策略、初始数据 |
| UI/UX 设计 | `docs/design/ui-design.md` | Design Token、页面原型、组件树、响应式策略 |
| PostgreSQL 迁移 | `docs/operations/postgresql-migration.md` | 15 分钟迁移步骤、Prisma 差异处理、回滚方案 |
| 环境配置 | `.env.example` | 所有环境变量说明 |
