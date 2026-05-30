import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authMiddleware } from "../middlewares/auth";
import * as ocrController from "../controllers/ocr.controller";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.env.UPLOAD_DIR || "./uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("只支持图片文件 (JPEG, PNG, GIF, WebP)"));
    }
  },
});

const router = Router();

router.use(authMiddleware);

router.post("/recognize", upload.single("image"), ocrController.recognize);

export default router;
