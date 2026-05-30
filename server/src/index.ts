import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { config } from "./config";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";

import authRoutes from "./routes/auth.routes";
import mistakeRoutes from "./routes/mistake.routes";
import subjectRoutes from "./routes/subject.routes";
import tagRoutes from "./routes/tag.routes";
import reviewRoutes from "./routes/review.routes";
import statsRoutes from "./routes/stats.routes";
import ocrRoutes from "./routes/ocr.routes";
import variantRoutes from "./routes/variant.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

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

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});

export default app;
