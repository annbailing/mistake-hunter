
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
        max_tokens: 16384,
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
        content:
          "你是一位经验丰富的学科教师，擅长根据原题生成变体练习题。请用中文回答。你只输出JSON数组，不要输出任何其他文字。",
      },
      {
        role: "user",
        content: `原题：${content}

请根据原题生成 ${count} 道变体练习题。直接输出如下JSON数组（不要包含在markdown代码块中，不要加任何解释文字）：
[
  {
    "content": "变体题目内容",
    "answer": "参考答案",
    "difficulty": 3
  }
]

difficulty 为 1-5 的整数，1最简单5最难。变体题考察相同知识点但数据或题型不同，难度应有变化。
数学公式请用 $...$（行内）或 $$...$$（块级）包裹，以便前端 KaTeX 渲染。`,
      },
    ];

    try {
      const result = await this.callAPI(messages);
      logger.info("generateVariants raw response", { result: result.slice(0, 500) });

      const parsed = extractJson<unknown>(result);

      // AI 可能返回数组，也可能包在对象里
      let items: Array<{ content?: string; answer?: string; difficulty?: number }>;
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        // 尝试取 variants/questions/items 字段
        const nested = obj.variants || obj.questions || obj.items || obj.data;
        if (Array.isArray(nested)) {
          items = nested as Array<Record<string, unknown>>;
        } else {
          logger.error("generateVariants: parsed object has no array field", { keys: Object.keys(obj) });
          return [];
        }
      } else {
        logger.error("generateVariants: unexpected parsed type", { type: typeof parsed });
        return [];
      }

      return items.map((item) => ({
        content: item.content || "",
        answer: item.answer || "",
        difficulty: Math.min(5, Math.max(1, Math.round((item.difficulty as number) || 3))),
      }));
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

export const aiService = new AIService();
