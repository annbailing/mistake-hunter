import { aiService } from "../utils/ai";
import { recognizeImage } from "../utils/ocr";
import logger from "../utils/logger";

export async function recognize(imagePath: string): Promise<{ text: string; source: "ai" | "tesseract" }> {
  // 优先用 AI 视觉模型（支持数学公式 LaTeX 输出）
  try {
    logger.info("OCR: trying AI vision model", { imagePath });
    const text = await aiService.ocrImage(imagePath);
    logger.info("OCR: AI vision succeeded", { length: text.length });
    return { text, source: "ai" };
  } catch (aiError: any) {
    logger.warn("OCR: AI vision failed, falling back to Tesseract", {
      error: aiError?.message,
    });
  }

  // 降级：使用本地 Tesseract.js
  try {
    const text = await recognizeImage(imagePath);
    logger.info("OCR: Tesseract fallback succeeded", { length: text.length });
    return { text, source: "tesseract" };
  } catch (tessError: any) {
    logger.error("OCR: both AI and Tesseract failed", { error: tessError?.message });
    throw new Error("图片识别失败，请手动输入题目内容");
  }
}
