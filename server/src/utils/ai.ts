
import { config } from "../config";
import logger from "./logger";
import { extractJson } from "./jsonExtractor";

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIResponse {
  error_type?: string;
  analysis?: string;
  suggestion?: string;
  variants?: Array<{
    content: string;
    answer: string;
    difficulty: number;
  }>;
}

const PROVIDER_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  claude: "https://api.anthropic.com/v1/messages",
  zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
};

class AIService {
  private provider: string;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.provider = config.ai.provider;
    this.apiKey = config.ai.apiKey;
    this.model = config.ai.model;
    if (config.ai.baseUrl) {
      this.baseUrl = config.ai.baseUrl;
    } else {
      this.baseUrl = PROVIDER_URLS[this.provider] || PROVIDER_URLS.openai;
    }
  }

  private getEndpoint(): string {
    if (this.provider === "claude") {
      return this.baseUrl + "/v1/messages";
    } else if (this.provider === "openai") {
      return this.baseUrl + "/v1/chat/completions";
    }
    return this.baseUrl;
  }

  private async callAPI(messages: AIMessage[]): Promise<string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.provider === "claude") {
      headers["x-api-key"] = this.apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    let body: string;

    if (this.provider === "claude") {
      const systemMsg = messages.find((m) => m.role === "system");
      const userMsgs = messages.filter((m) => m.role !== "system");
      body = JSON.stringify({
        model: this.model,
        max_tokens: 32768,
        system: systemMsg?.content || "",
        messages: userMsgs.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } else {
      body = JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      });
    }

    try {
      const endpoint = this.getEndpoint();
      logger.info("AI API request", { endpoint, provider: this.provider, model: this.model });
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("AI API call failed", {
          status: response.status,
          error: errorText,
        });
        throw new Error(`AI API error: ${response.status}`);
      }

      const data: any = await response.json();
      logger.info("AI API response", { data });

      if (this.provider === "claude") {
        // 小米模型返回的 content 数组中，第一个是 thinking 类型，后面才是真正的文本
        const textContent = data.content?.find((item: any) => item.type === "text");
        if (!textContent?.text) {
          const thinkingOnly = data.content?.every((item: any) => item.type === "thinking");
          if (thinkingOnly) {
            throw new Error("AI 模型思考超时，未生成文本输出。请增加 max_tokens 或简化提示词。");
          }
        }
        return textContent?.text || "";
      }
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      logger.error("AI API call exception", { error });
      throw error;
    }
  }

  async analyzeError(
    content: string,
    myAnswer: string | null,
    correctAnswer: string | null
  ): Promise<{ error_type: string; analysis: string; suggestion: string }> {
    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "你是一位经验丰富的学科教师，擅长分析学生的错题。请用中文回答。请严格返回JSON格式，不要包含markdown代码块标记。数学公式请用 $...$ 包裹。",
      },
      {
        role: "user",
        content: `请分析以下错题的错因：

题目内容：${content}
${myAnswer ? `学生的答案：${myAnswer}` : ""}
${correctAnswer ? `正确答案：${correctAnswer}` : ""}

请返回以下JSON格式：
{
  "error_type": "错因类型，从以下选项中选择：concept(概念错误)/compute(计算错误)/read(审题错误)/forget(遗忘错误)/method(方法错误)",
  "analysis": "详细的错因分析，200字以内",
  "suggestion": "改进建议和学习方法，200字以内"
}`,

      },
    ];

    const result = await this.callAPI(messages);
    const parsed = extractJson<{ error_type?: string; analysis?: string; suggestion?: string }>(result);
    return {
      error_type: parsed.error_type || "concept",
      analysis: parsed.analysis || "",
      suggestion: parsed.suggestion || "",
    };
  }

  async generateVariants(
    content: string,
    count: number = 3
  ): Promise<Array<{ content: string; answer: string; difficulty: number }>> {
    const messages: AIMessage[] = [
      {
        role: "system",
        content: `你是一位经验丰富的学科教师，擅长编写高质量练习题。请严格遵守以下规则：

1. 只输出指定格式，不输出任何额外文字、解释或markdown标记
2. 所有题目和答案必须用纯文本，绝对禁止使用LaTeX公式（如 $$、\\frac、\\sqrt 等）。数学表达式直接用中文描述或简单符号，如"x的平方"、"√2"、"1/2"
3. 答案直接写最终结果，不要写"解："、"答："等引导词
4. 答案是给学生直接看的，要简洁明了`,
      },
      {
        role: "user",
        content: `原题：${content}

请以上面这道题为基础，生成3道同类型变体题。要求：
- 同一知识点，但要变换题型或角度。比如：原题是计算题，变体可以是应用题、判断题、填空题等
- 每个变体必须与原题有本质区别：改变已知条件和求解目标、增加或减少条件、把正向计算改成反向推导等
- 不要只改数字，要改变题目结构
- 难度依次递增（1→3）

严格按照以下格式输出，题之间用 --- 分隔：

【题】
（纯文本题目，禁止LaTeX）
【答】
（最终答案，不要写"解""答"等前缀）
【度】
（1-5的数字）

---
【题】
（纯文本题目，禁止LaTeX）
【答】
（最终答案，不要写"解""答"等前缀）
【度】
（1-5的数字）

---
【题】
（纯文本题目，禁止LaTeX）
【答】
（最终答案，不要写"解""答"等前缀）
【度】
（1-5的数字）

只输出以上内容，不要任何额外文字。`,
      },
    ];

    try {
      const result = await this.callAPI(messages);
      logger.info("generateVariants raw response", { length: result.length, preview: result.slice(0, 600) });

      const variants = parseVariantText(result);
      if (variants.length === 0) {
        logger.error("generateVariants: parsed 0 variants", { resultPreview: result.slice(0, 800) });
        return [];
      }

      logger.info("generateVariants parsed", { count: variants.length });
      return variants;
    } catch (err: any) {
      logger.error("generateVariants exception", { message: err.message });
      throw err;
    }
  }

  async judgeAnswer(
    questionContent: string,
    correctAnswer: string,
    userAnswer: string
  ): Promise<boolean> {
    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "你是一位严谨的学科教师。请判断学生的答案是否正确。只需要回答 true 或 false。请严格返回JSON格式，不要包含markdown代码块标记。",
      },
      {
        role: "user",
        content: `题目：${questionContent}
参考答案：${correctAnswer}
学生答案：${userAnswer}

请返回JSON格式：{ "is_correct": true 或 false }`,
      },
    ];

    const result = await this.callAPI(messages);
    const parsed = extractJson<{ is_correct?: boolean }>(result);
    return !!parsed.is_correct;
  }
}

/** 解析变体题文本，支持多种格式 */
function parseVariantText(
  raw: string
): Array<{ content: string; answer: string; difficulty: number }> {
  let text = raw.replace(/```[\s\S]*?```/g, "").trim();

  // 清理AI可能额外输出的引导文字（在第一个【题】之前的内容）
  const firstMarker = text.indexOf("【题】");
  if (firstMarker > 0) {
    text = text.slice(firstMarker);
  }

  // 按 --- 或 ___ 或 *** 分隔各题
  let blocks = text.split(/\n\s*[-_*]{3,}\s*\n/);
  // 如果没找到分隔符，尝试按 【题】拆分
  if (blocks.length < 2) {
    blocks = text.split(/\n(?=【题】)/);
  }
  // 如果还是没有，尝试按空行分隔
  if (blocks.length < 2) {
    blocks = text.split(/\n\n+/);
  }

  const variants: Array<{ content: string; answer: string; difficulty: number }> = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    // 提取题目：【题】之后，到下一个【答】或【度】或块尾
    const contentMatch = block.match(/【题】\s*([\s\S]*?)(?=\n【[答度]】|$)/);
    const content = contentMatch?.[1]?.trim() || "";

    if (!content || content.length < 2) continue;

    // 提取答案：【答】之后
    const answerMatch = block.match(/【答】\s*([\s\S]*?)(?=\n【度】|$)/);
    let answer = answerMatch?.[1]?.trim() || "";

    // 清理答案中的引导词
    answer = answer
      .replace(/^(解|答|答案)[：:]\s*/i, "")
      .replace(/^原式\s*[=＝]\s*/i, "")
      .replace(/^(题目|原题)[：:]\s*/i, "")
      .trim();

    // 提取难度
    const diffMatch = block.match(/【度】\s*(\d+)/);
    const difficulty = diffMatch
      ? Math.min(5, Math.max(1, parseInt(diffMatch[1]) || 3))
      : variants.length + 1; // 没有标注时默认递增

    variants.push({ content, answer, difficulty });
  }

  // 最多3道
  return variants.slice(0, 3);
}

export const aiService = new AIService();
