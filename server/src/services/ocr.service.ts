import { recognizeImage } from "../utils/ocr";

export async function recognize(imagePath: string) {
  const text = await recognizeImage(imagePath);
  return { text };
}
