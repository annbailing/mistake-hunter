import Tesseract from "tesseract.js";
import logger from "./logger";

export async function recognizeImage(
  imagePath: string
): Promise<string> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "chi_sim+eng", {
      logger: (info: { status: string; progress: number }) => {
        if (info.status === "recognizing text") {
          logger.debug(`OCR progress: ${Math.round(info.progress * 100)}%`);
        }
      },
    });

    return text.trim();
  } catch (error) {
    logger.error("OCR recognition failed", { imagePath, error });
    throw new Error("图片文字识别失败");
  }
}
