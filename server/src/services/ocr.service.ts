import { recognizeImage as localRecognize } from "../utils/ocr";
import { aiService } from "../utils/ai";
import logger from "../utils/logger";

export async function recognize(imagePath: string) {
  try {
    logger.info("Attempting AI vision OCR...", { imagePath });
    const text = await aiService.ocrImage(imagePath);
    return { text, method: "ai" };
  } catch (error: any) {
    logger.warn("AI vision OCR failed, falling back to Tesseract.js", { error: error.message });
    const text = await localRecognize(imagePath);
    return { text, method: "local" };
  }
}
