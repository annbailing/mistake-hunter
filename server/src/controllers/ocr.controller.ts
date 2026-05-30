import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as ocrService from "../services/ocr.service";

export async function recognize(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "请上传图片文件" });
      return;
    }
    const result = await ocrService.recognize(file.path);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
