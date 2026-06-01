import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  ai: {
    provider: process.env.AI_PROVIDER || "openai",
    apiKey: process.env.AI_API_KEY || "",
    model: process.env.AI_MODEL || "gpt-4o-mini",
    // OCR 专用模型（需要支持视觉能力），默认与 model 相同
    ocrModel: process.env.AI_OCR_MODEL || process.env.AI_MODEL || "gpt-4o-mini",
    baseUrl: process.env.AI_BASE_URL || "",
  },
  upload: {
    dir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  },
};
