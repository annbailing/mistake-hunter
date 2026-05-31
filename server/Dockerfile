# ---- 后端开发环境 ----
FROM node:20-alpine AS dev

# Tesseract.js 依赖的系统库（OCR 文字识别需要）
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-chi_sim \
    tesseract-ocr-data-eng

WORKDIR /app

# 先拷贝 package 文件，利用 Docker 层缓存（不改依赖就不重装）
COPY package.json package-lock.json* ./

RUN npm install

# 拷贝源码
COPY . .

# 生成 Prisma 客户端（类型安全的数据访问）
RUN npx prisma generate

# 暴露端口
EXPOSE 3001

# 启动脚本：自动迁移数据库 + 启动开发服务器（热重载）
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init && npm run dev"]
