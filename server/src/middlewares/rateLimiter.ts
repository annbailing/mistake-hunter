import rateLimit from "express-rate-limit";

// 通用 API 限流：1 分钟内最多 60 次（正常使用不会触发）
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "请求过于频繁，请稍后再试",
  },
});

// 登录/注册限流：15 分钟内最多 10 次
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "操作过于频繁，请 15 分钟后再试",
  },
});

// AI 分析限流：每分钟最多 5 次（AI 调用成本高）
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "AI 请求过于频繁，请稍后再试",
  },
});
