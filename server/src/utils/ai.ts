
import { config } from "../config";
import logger from "./logger";
import { extractJson } from "./jsonExtractor";
import * as math from "mathjs";

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; [key: string]: any }>;
}

// 工具定义：计算器
const CALCULATOR_TOOL = {
  name: "calculator",
  description: "执行数学计算，支持基本运算、三角函数、对数、幂运算等。返回计算结果。",
  input_schema: {
    type: "object" as const,
    properties: {
      expression: {
        type: "string",
        description: "数学表达式，如 '2+3*4', 'sqrt(16)', 'sin(pi/4)', 'log(100, 10)'",
      },
    },
    required: ["expression"],
  },
};

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
  private ocrModel: string; // OCR 专用模型（需支持视觉能力）
  private baseUrl: string;

  constructor() {
    this.provider = config.ai.provider;
    this.apiKey = config.ai.apiKey;
    this.model = config.ai.model;
    this.ocrModel = config.ai.ocrModel;
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

  private async callAPI(messages: AIMessage[], tools?: any[]): Promise<string> {
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
      const requestBody: any = {
        model: this.model,
        max_tokens: 32768,
        system: systemMsg?.content || "",
        messages: userMsgs.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
      // 如果有工具，添加到请求中
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }
      body = JSON.stringify(requestBody);
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
      logger.info("AI API request", { endpoint, provider: this.provider, model: this.model, hasTools: !!tools });

      // 使用 AbortController 实现超时控制（3分钟）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
        if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
          logger.error("AI response: content field missing or empty", { dataKeys: Object.keys(data) });
          throw new Error("AI 响应格式异常：缺少 content 字段");
        }

        // 处理工具调用
        if (data.stop_reason === "tool_use" && tools && tools.length > 0) {
          logger.info("AI requested tool use", {
            toolUseBlocks: data.content.filter((c: any) => c.type === "tool_use"),
          });

          // 执行工具调用并继续对话
          const toolResults: any[] = [];
          for (const block of data.content) {
            if (block.type === "tool_use") {
              const result = await this.executeTool(block.name, block.input);
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
          }

          logger.info("Tool results prepared", { toolResults });

          // 将工具结果添加到消息中，继续调用 API
          // 注意：工具结果需要作为 user 角色发送，格式为 content 数组
          const assistantMessage = { role: "assistant" as const, content: data.content };
          const toolResultMessage = { role: "user" as const, content: toolResults };

          logger.info("Continuing conversation with tool results", {
            messageCount: messages.length + 2,
            toolResultContent: toolResults,
          });

          return this.callAPI([...messages, assistantMessage, toolResultMessage], tools);
        }

        const textContent = data.content.find((item: any) => item.type === "text");
        if (!textContent?.text) {
          const thinkingOnly = data.content.every((item: any) => item.type === "thinking");
          if (thinkingOnly) {
            throw new Error("AI 模型思考超时，未生成文本输出。请增加 max_tokens 或简化提示词。");
          }
          logger.error("AI response: no text content found", {
            contentTypes: data.content.map((c: any) => c.type),
          });
          throw new Error("AI 响应中未找到文本内容");
        }
        return textContent.text;
      }
      // OpenAI 兼容格式
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        logger.error("AI response: no choices/message/content", { dataKeys: Object.keys(data) });
        throw new Error("AI 响应格式异常：未找到有效内容");
      }
      return content;
    } catch (error: any) {
      logger.error("AI API call exception", { error });
      // 超时错误特殊处理
      if (error.name === 'AbortError') {
        throw new Error("AI 请求超时（超过3分钟），题目可能过于复杂。请尝试简化题目或稍后重试。");
      }
      throw error;
    }
  }

  /**
   * 执行工具调用
   */
  private async executeTool(name: string, input: any): Promise<string> {
    logger.info("Executing tool", { name, input });

    if (name === "calculator") {
      try {
        const result = math.evaluate(input.expression);
        logger.info("Calculator result", { expression: input.expression, result });
        return String(result);
      } catch (err: any) {
        const errorMsg = `计算错误: ${err.message}`;
        logger.error("Calculator error", { expression: input.expression, error: err.message });
        return errorMsg;
      }
    }

    return `未知工具: ${name}`;
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
    const knowledgeHint = extractKnowledgeHint(content);

    const messages: AIMessage[] = [
      {
        role: "system",
        content: `你是一位经验丰富的学科教师。请生成3道变体练习题，返回JSON数组。

规则：
- 知识点必须和原题完全一致，不能跑偏
- 数学公式用 $...$ 包裹（行内公式），如 $\\int \\frac{3}{x^3+1}dx$
- 题目像试卷一样自然，答案只写最终结果，不要"解""答"
- 如果需要计算，使用计算器工具获取精确结果，不要自己推导`,
      },
      {
        role: "user",
        content: `原题：${content}

请生成3道同知识点变体题。核心约束：
- 知识点：【${knowledgeHint}】，不离题
- 变化方式：改条件、反问、增减信息、变换题型（选择/填空/计算/判断），不能只改数字
- 数学公式用 $...$ 包裹，如 $x^2$、$\\frac{1}{2}$
- 难度1→3递增
- 如果需要计算（如计算积分、求导结果、解方程等），请使用计算器工具

直接返回JSON数组（不含markdown标记）：
[{"content":"题目文本","answer":"最终答案","difficulty":1}, ...]`,
      },
    ];

    try {
      // 使用工具调用，让 AI 可以使用计算器
      logger.info("generateVariants: starting API call with tools");
      const result = await this.callAPI(messages, [CALCULATOR_TOOL]);
      logger.info("generateVariants raw response", { length: result.length, preview: result.slice(0, 600) });

      if (!result || result.length === 0) {
        logger.error("generateVariants: empty response from API");
        return [];
      }

      const variants = parseVariantText(result);
      if (variants.length === 0) {
        logger.error("generateVariants: parsed 0 variants", { resultPreview: result.slice(0, 800) });
        return [];
      }

      logger.info("generateVariants parsed", { count: variants.length });
      return variants;
    } catch (err: any) {
      logger.error("generateVariants exception", { message: err.message, stack: err.stack });
      throw err;
    }
  }

  /**
   * 使用 AI 视觉能力识别图片中的文字和数学公式（输出 LaTeX）
   */
  async ocrImage(imagePath: string): Promise<string> {
    const fs = await import("fs");
    const path = await import("path");

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Data = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).toLowerCase().replace(".", "");
    const mediaType = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";

    const prompt = `你是专业的数学公式 OCR 引擎。请识别图片中的所有文字和数学公式，严格遵守以下规则：

1. 数学公式用标准 LaTeX 语法表示，行内公式用 $...$，独立公式用 $$...$$
2. 积分号用 \\int，分数用 \\frac{分子}{分母}，上下标用 ^ 和 _
3. 常见符号：\\sqrt、\\sum、\\prod、\\lim、\\infty、\\alpha、\\beta、\\theta 等
4. 只输出识别内容，不要解释、不要注释，不要加任何前缀

示例输出格式：
- 求 $\\int \\frac{3}{x^2+1} dx$ 的不定积分

请直接输出识别结果：`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let body: string;
    let endpoint: string;

    if (this.provider === "claude") {
      headers["x-api-key"] = this.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      endpoint = this.baseUrl.endsWith("/v1/messages")
        ? this.baseUrl
        : this.baseUrl + "/v1/messages";
      body = JSON.stringify({
        model: this.ocrModel,
        max_tokens: 2048,
        system: "你是专业的数学 OCR 引擎，能精确识别手写和印刷体数学公式，输出标准 LaTeX。",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      });
    } else {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      endpoint = this.baseUrl.endsWith("/chat/completions")
        ? this.baseUrl
        : this.baseUrl + "/v1/chat/completions";
      body = JSON.stringify({
        model: this.ocrModel,
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mediaType};base64,${base64Data}` },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      });
    }

    logger.info("AI OCR request", { endpoint, provider: this.provider, model: this.ocrModel, mediaType });

    // OCR 也需要超时控制（2分钟）
    const ocrController = new AbortController();
    const ocrTimeoutId = setTimeout(() => ocrController.abort(), 120000);

    const response = await fetch(endpoint, { method: "POST", headers, body, signal: ocrController.signal });
    clearTimeout(ocrTimeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      logger.error("AI OCR API call failed", { status: response.status, error: errorText });
      throw new Error(`AI OCR error: ${response.status}`);
    }

    const data: any = await response.json();
    logger.info("AI OCR response received");

    if (this.provider === "claude") {
      const textContent = data.content?.find((item: any) => item.type === "text");
      if (!textContent?.text) throw new Error("AI OCR 响应中未找到文本");
      return textContent.text.trim();
    }
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI OCR 响应格式异常");
    return content.trim();
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

/** 从原题中提取知识点关键词，用于约束AI不离题 */
function extractKnowledgeHint(content: string): string {
  // 去掉LaTeX标记
  const cleaned = content
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]+\$/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\\\([\s\S]*?\\\)/g, " ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}\[\]]/g, " ");

  // 知识点关键词匹配
  const patterns: Array<{ regex: RegExp; label: string }> = [
    // 数学
    { regex: /积分|∫|integral|不定积分|定积分|微积分/, label: "积分" },
    { regex: /求导|导数|微分|dy\/dx|f'/, label: "求导/微分" },
    { regex: /极限|lim|limt/, label: "极限" },
    { regex: /矩阵|行列式|特征值|特征向量/, label: "线性代数-矩阵" },
    { regex: /概率|期望|方差|标准差|正态分布/, label: "概率统计" },
    { regex: /三角|sin|cos|tan|cot|正弦|余弦/, label: "三角函数" },
    { regex: /方程|解.*=|求根|一元二次/, label: "解方程" },
    { regex: /函数|定义域|值域|单调|奇偶/, label: "函数" },
    { regex: /数列|等差|等比|通项|求和/, label: "数列" },
    { regex: /几何|面积|体积|周长|三角形|圆|矩形|梯形/, label: "几何" },
    { regex: /向量|坐标|数量积|叉乘/, label: "向量" },
    { regex: /不等式|大于|小于|≥|≤|解集/, label: "不等式" },
    // 物理
    { regex: /力|牛顿|加速度|F=|质量|重力|摩擦/, label: "力学" },
    { regex: /电[路压阻流]|欧姆|电阻|电容|电流|电压/, label: "电学" },
    { regex: /光|透镜|反射|折射|焦距/, label: "光学" },
    { regex: /热|温度|热量|比热|热胀/, label: "热学" },
    // 化学
    { regex: /化学[反方程]|化合|分解|置换/, label: "化学反应" },
    { regex: /元素|周期|原子|分子|电子/, label: "化学-原子结构" },
    { regex: /酸碱|pH|中和|滴定/, label: "化学-酸碱" },
    { regex: /氧化|还原|氧还/, label: "化学-氧化还原" },
  ];

  for (const { regex, label } of patterns) {
    if (regex.test(cleaned)) {
      return label;
    }
  }

  // 没有命中则取前20字作为知识点提示
  const short = cleaned.trim().replace(/\s+/g, " ").slice(0, 30);
  return short || "与题目相关";
}

/** 解析变体题，支持JSON数组和【题】【答】【度】文本两种格式 */
function parseVariantText(
  raw: string
): Array<{ content: string; answer: string; difficulty: number }> {
  let text = raw.trim();
  logger.info("parseVariantText input", { length: text.length, preview: text.slice(0, 300) });

  // ========== 方式1：JSON 数组格式（用 extractJson 处理 LaTeX 转义）==========
  try {
    const parsed = extractJson<any[]>(text);
    logger.info("parseVariantText: extractJson result", { isArray: Array.isArray(parsed), length: Array.isArray(parsed) ? parsed.length : 0 });
    if (Array.isArray(parsed) && parsed.length > 0) {
      const variants: Array<{ content: string; answer: string; difficulty: number }> = [];
      for (const item of parsed) {
        const content = String(item.content || "").trim();
        if (!content || content.length < 1) {
          logger.info("parseVariantText: skipping empty content item", { item });
          continue;
        }
        let answer = String(item.answer || "").trim();
        answer = answer
          .replace(/^(解|答|答案)[：:]\s*/i, "")
          .replace(/^(题目|原题)[：:]\s*/i, "")
          .trim();
        const difficulty = Math.min(5, Math.max(1, parseInt(String(item.difficulty)) || variants.length + 1));
        variants.push({ content, answer, difficulty });
      }
      if (variants.length > 0) {
        logger.info("parseVariantText: parsed as JSON", { count: variants.length });
        return variants.slice(0, 3);
      } else {
        logger.info("parseVariantText: JSON parsed but all items filtered out");
      }
    }
  } catch (err: any) {
    logger.info("parseVariantText: JSON parse failed, trying text format", { error: err.message?.slice(0, 80) });
  }

  // ========== 方式2：【题】【答】【度】文本格式 ==========
  const firstMarker = text.indexOf("【题】");
  if (firstMarker > 0) {
    text = text.slice(firstMarker);
  }

  let blocks = text.split(/\n\s*[-_*]{3,}\s*\n/);
  if (blocks.length < 2) {
    blocks = text.split(/\n(?=【题】)/);
  }
  if (blocks.length < 2) {
    blocks = text.split(/\n\n+/);
  }

  const variants: Array<{ content: string; answer: string; difficulty: number }> = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    const contentMatch = block.match(/【题】\s*([\s\S]*?)(?=\n【[答度]】|$)/);
    const content = contentMatch?.[1]?.trim() || "";
    if (!content || content.length < 1) continue;

    const answerMatch = block.match(/【答】\s*([\s\S]*?)(?=\n【度】|$)/);
    let answer = answerMatch?.[1]?.trim() || "";
    answer = answer
      .replace(/^(解|答|答案)[：:]\s*/i, "")
      .replace(/^(题目|原题)[：:]\s*/i, "")
      .trim();

    const diffMatch = block.match(/【度】\s*(\d+)/);
    const difficulty = diffMatch
      ? Math.min(5, Math.max(1, parseInt(diffMatch[1]) || 3))
      : variants.length + 1;

    variants.push({ content, answer, difficulty });
  }

  if (variants.length > 0) {
    logger.info("parseVariantText: parsed as text format", { count: variants.length });
  } else {
    logger.warn("parseVariantText: all formats failed", { preview: raw.slice(0, 400) });
  }

  return variants.slice(0, 3);
}

export const aiService = new AIService();
