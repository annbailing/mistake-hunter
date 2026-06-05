# 错题猎人 (Mistake Hunter)

> AI 驱动的智能错题管理系统 — 帮助学生从"记录错题"升级为"消灭弱点"

核心闭环：**录入错题 → AI 分析错因 → 生成变体题 → 遗忘曲线复习 → 薄弱点可视化**

## 核心功能

| 功能 | 说明 |
|------|------|
| 拍照 OCR 录入 | AI 视觉模型识别 + 手动输入，支持 Markdown + LaTeX |
| AI 错因分析 | 5 类错因自动归类（概念/计算/审题/遗忘/方法） |
| 变体题生成 | AI 生成 3 道同类练习题，支持在线作答评判，Tool Use 计算器加速 |
| 智能复习 | 艾宾浩斯遗忘曲线（1/2/4/7/15 天），今日任务提醒 |
| 知识薄弱点地图 | 按章节 + 标签可视化薄弱点热力图 |
| 学习统计 | 趋势折线图 + 错因饼图 + 科目柱状图 |
| 多模型 AI | 支持 OpenAI / Claude / 智谱 (Zhipu) 热切换 |

## 技术栈

- **前端**：React 18 + TypeScript + Vite 5 + TailwindCSS 3
- **后端**：Express 4 + Prisma + SQLite（开发）/ PostgreSQL（生产）
- **AI**：可插拔架构，统一 AIService 类，支持三模型切换 + Tool Use 工具调用
- **部署**：Docker Compose 一键部署

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/mistake-hunter.git
cd mistake-hunter

# 安装后端依赖
cd server
npm install

# 配置环境变量
cp ../.env.example .env
# 编辑 .env 填入你的 AI API Key

# 数据库初始化
npx prisma generate
npx prisma migrate dev

# 启动后端
npm run dev

# 新终端，安装前端依赖
cd ../client
npm install

# 启动前端
npm run dev
```

访问 http://localhost:5173

### 环境变量

参见 [`.env.example`](.env.example)，主要配置：

| 变量 | 说明 |
|------|------|
| `AI_PROVIDER` | AI 模型提供商（openai / claude / zhipu） |
| `AI_API_KEY` | AI API 密钥 |
| `AI_MODEL` | 模型名称 |
| `AI_BASE_URL` | API 地址（可选，用于中转） |

## 项目结构

```
mistake-hunter/
├── client/          # 前端 (React 18 + Vite 5)
│   └── src/
│       ├── pages/       # 13 个页面（全部懒加载）
│       ├── components/  # 布局 + UI 组件
│       ├── services/    # API 调用层
│       └── stores/      # zustand 状态管理
├── server/          # 后端 (Express 4 + Prisma)
│   └── src/
│       ├── controllers/ # 8 个控制器
│       ├── routes/      # 8 个路由模块
│       ├── services/    # 业务逻辑层
│       └── middlewares/  # 中间件（鉴权/校验/限流/错误处理）
└── docs/            # 项目文档
```

## 文档

| 文档 | 说明 |
|------|------|
| [产品需求文档](docs/prd/PRD.md) | 完整 PRD：用户故事、功能模块、路线图 |
| [架构设计](docs/architecture/architecture.md) | 系统架构、API 规范、技术选型 |
| [数据库设计](docs/database/database-design.md) | ER 图、DDL、索引策略 |
| [UI/UX 设计](docs/design/ui-design.md) | Design Token、页面原型、组件树 |
| [PostgreSQL 迁移](docs/operations/postgresql-migration.md) | 生产环境数据库迁移指南 |

## 版权声明

Copyright © 2026 annbailing. 保留所有权利。

允许学习、研究、修改和非商业用途的使用与分享。**禁止商用**，包括但不限于：将本项目代码用于商业产品、出售或提供付费服务。
