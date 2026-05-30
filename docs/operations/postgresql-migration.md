# PostgreSQL 迁移指南

> 当前数据库：SQLite (dev.db)  
> 目标数据库：PostgreSQL 15+

---

## 一、当前状态

Prisma schema 已完全兼容 PostgreSQL，无需修改任何 model 定义。切换只需两步：改 datasource + 改连接串。

---

## 二、迁移步骤（预计 15 分钟）

### Step 1：安装 PostgreSQL

- **Windows**：https://www.postgresql.org/download/windows/
- **macOS**：`brew install postgresql@15`
- **Linux**：`apt install postgresql-15`

创建数据库：

```sql
CREATE DATABASE mistake_hunter;
CREATE USER mistake_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE mistake_hunter TO mistake_user;
```

### Step 2：修改 `server/prisma/schema.prisma`

```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
}
```

### Step 3：修改 `.env`

```diff
- DATABASE_URL="file:./prisma/dev.db"
+ DATABASE_URL="postgresql://mistake_user:your_strong_password@localhost:5432/mistake_hunter"
```

### Step 4：生成迁移并部署

```bash
cd server
npx prisma migrate dev --name init-pg
npx prisma generate
npx prisma db seed
```

### Step 5：验证

```bash
npm run test
```

---

## 三、注意事项

| 项目 | SQLite | PostgreSQL |
|------|--------|------------|
| 并发写入 | ❌ 单写锁 | ✅ MVCC 高并发 |
| JSON 字段 | TEXT 存储 | JSONB（更高效） |
| 全文搜索 | 不支持 | `tsvector` |
| 部署 | 单文件 | 需独立服务 |
| 生产推荐 | ❌ | ✅ |

### Prisma schema 差异处理

当前 schema 中 `String` 类型的 `id`（UUID）在 PostgreSQL 中会映射为 `TEXT`。如需优化：

```prisma
// 可选优化：PostgreSQL 原生 UUID
id  String  @id @default(uuid()) @db.Uuid
```

加上 `@db.Uuid` 后 PostgreSQL 会用原生 `UUID` 类型，性能和存储更优。

---

## 四、回滚方案

如果迁移出问题，回退只需：

```bash
# 改回 SQLite
git checkout server/prisma/schema.prisma
git checkout .env
npx prisma generate
```

原有的 `dev.db` 数据不会丢失。
