# ---- 前端开发环境 ----
FROM node:20-alpine

WORKDIR /app

# 先拷贝 package 文件，缓存依赖层
COPY package.json package-lock.json* ./

RUN npm install

# 拷贝源码
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
