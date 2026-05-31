import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { config } from "./config";
import { errorHandler } from "./middlewares/errorHandler";
import { apiLimiter, aiLimiter } from "./middlewares/rateLimiter";

import authRoutes from "./routes/auth.routes";
import mistakeRoutes from "./routes/mistake.routes";
import subjectRoutes from "./routes/subject.routes";
import tagRoutes from "./routes/tag.routes";
import reviewRoutes from "./routes/review.routes";
import statsRoutes from "./routes/stats.routes";
import ocrRoutes from "./routes/ocr.routes";
import variantRoutes from "./routes/variant.routes";

const app = express();

// 安全头 (X-Content-Type-Options, X-Frame-Options, CSP 等)
app.use(helmet());

// CORS 白名单
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"];
app.use(cors({
  origin: (origin, callback) => {
    // 非浏览器请求 (如 curl) 或无 origin 放行
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: origin not allowed"));
    }
  },
  credentials: true,
}));

// 限制 body 大小，防大包攻击
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/mistakes", mistakeRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/variants", variantRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use(errorHandler);

export default app;
