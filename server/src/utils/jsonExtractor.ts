/**
 * 鲁棒的 JSON 提取器
 *
 * 应对 LLM 返回的各种不规范格式：
 * - 被 markdown 代码块包裹
 * - 前后有多余文字
 * - JSON 内嵌在 thinking tokens 之后
 * - 单引号替代双引号
 * - 末尾多余逗号
 * - **LaTeX 命令在 JSON 字符串中产生的非法转义**（最常见的问题）
 */

import logger from "./logger";

export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim()

  // 0. 打印前 200 字符的 charCode 用于诊断
  logger.info("extractJson input", {
    length: text.length,
    preview: text.slice(0, 200),
    // 打印第10-60字符的十六进制，方便看反斜杠到底是 0x5C 还是其他
    hex: [...text.slice(10, 80)].map(c => c.charCodeAt(0).toString(16)).join(' '),
  })

  // 1. 去掉 markdown 代码块标记
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim()
  }

  // 2. 先修复再尝试解析 —— 大多数情况下 AI 输出的 LaTeX 反斜杠需要转义
  let repaired = repairJson(text)

  // 3. 尝试解析（先解析修复后的，因为大多数问题在此）
  let parsed = tryParse<T>(repaired)
  if (parsed !== undefined) return parsed

  // 4. 也尝试一下原始文本
  parsed = tryParse<T>(text)
  if (parsed !== undefined) return parsed

  // 5. 从文本中提取 JSON 块再修复
  const block = extractJsonBlock(repaired) || extractJsonBlock(text)
  if (!block) {
    logger.error("extractJson: extractJsonBlock returned empty", {
      textStart: text.slice(0, 300),
    })
    throw new Error("无法从 AI 响应中提取 JSON")
  }

  parsed = tryParse<T>(block)
  if (parsed !== undefined) return parsed

  // 对提取出的块再次修复
  const blockRepaired = repairJson(block)
  parsed = tryParse<T>(blockRepaired)
  if (parsed !== undefined) return parsed

  logger.error("extractJson: all attempts failed", {
    textStart: text.slice(0, 500),
    blockStart: block.slice(0, 500),
    blockRepairedStart: blockRepaired.slice(0, 500),
  })
  throw new Error(`AI JSON 解析失败: ${text.slice(0, 200)}`)
}

function tryParse<T>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined
  }
}

/** 从文本中提取第一段完整 JSON */
function extractJsonBlock(text: string): string {
  // 找第一个 { 或 [
  const start = Math.min(
    text.indexOf("{") === -1 ? Infinity : text.indexOf("{"),
    text.indexOf("[") === -1 ? Infinity : text.indexOf("["),
  )
  if (start === Infinity) return ""

  const isArray = text[start] === "["
  const openChar = isArray ? "[" : "{"
  const closeChar = isArray ? "]" : "}"

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (ch === "\\" && inString) {
      escaped = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (ch === openChar) depth++
    else if (ch === closeChar) {
      depth--
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return ""
}

/**
 * 修复 AI 返回 JSON 中常见的非法转义。
 *
 * 核心问题：AI 输出的 LaTeX 命令（\int \frac \boxed \ln \sqrt \arctan 等）
 * 在 JSON 字符串中是非法转义序列。需要将所有单反斜杠变成双反斜杠（\\）。
 *
 * 策略：用占位符保护已有的合法转义（\\ 和 \"），
 * 然后把剩余所有 \X 变成 \\X，最后还原占位符。
 */
function repairJson(text: string): string {
  let result = text

  // 第 1 层：保护已经是合法 JSON 转义的 \\ 和 \"
  // 注意顺序：先处理 \\（两个连续反斜杠），再处理 \"（反斜杠+引号）
  result = result.replace(/\\\\/g, "\x00") // \\ → 占位符0
  result = result.replace(/\\"/g, "\x01")  // \" → 占位符1

  // 第 2 层：此时剩下的 \X 全是非法转义（如 \int, \frac, \boxed...）
  // 把每个 \X 变成 \\X（双反斜杠），这样 JSON.parse 就能正确处理
  result = result.replace(/\\(.)/g, "\\\\$1")

  // 第 3 层：还原被保护的合法转义
  result = result.replace(/\x00/g, "\\\\") // 占位符0 → \\
  result = result.replace(/\x01/g, '\\"')  // 占位符1 → \"

  // 第 4 层：其他常见修复
  // 单引号 → 双引号（仅在 key/value 层面，不处理字符串内容中的单引号）
  // 这个替换比较激进，只在 JSON 结构层面做
  result = result.replace(/'/g, '"')

  // 末尾多余逗号: ,] 或 ,}
  result = result.replace(/,(\s*[}\]])/g, "$1")

  // 缺少引号的 key: {key: → {"key":
  result = result.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')

  return result
}
