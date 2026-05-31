/**
 * 鲁棒的 JSON 提取器
 *
 * 应对 LLM 返回的各种不规范格式：
 * - 被 markdown 代码块包裹
 * - 前后有多余文字
 * - JSON 内嵌在 thinking tokens 之后
 * - 单引号替代双引号
 * - 末尾多余逗号
 */

export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim()

  // 1. 去掉 markdown 代码块标记
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim()
  }

  // 2. 尝试直接解析
  const parsed = tryParse<T>(text)
  if (parsed !== undefined) return parsed

  // 3. 从文本中提取第一个 JSON 对象或数组
  text = extractJsonBlock(text)
  if (!text) throw new Error('无法从 AI 响应中提取 JSON')

  const retry = tryParse<T>(text)
  if (retry !== undefined) return retry

  // 4. 修复常见问题后重试
  const repaired = repairJson(text)
  const final = tryParse<T>(repaired)
  if (final !== undefined) return final

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
    text.indexOf('{') === -1 ? Infinity : text.indexOf('{'),
    text.indexOf('[') === -1 ? Infinity : text.indexOf('['),
  )
  if (start === Infinity) return ''

  const isArray = text[start] === '['
  const openChar = isArray ? '[' : '{'
  const closeChar = isArray ? ']' : '}'

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (ch === '\\' && inString) {
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

  return ''
}

/** 修复常见 JSON 格式问题 */
function repairJson(text: string): string {
  return (
    text
      // LaTeX 命令反斜杠在 JSON 中需要转义（\[ \( \frac \int 等）
      .replace(/\\([^"\\/bfnrtu])/g, '\\\\$1')
      // 单引号 → 双引号（仅 key 和 string value）
      .replace(/'/g, '"')
      // 末尾多余逗号
      .replace(/,(\s*[}\]])/g, '$1')
      // 缺少引号的 key
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
  )
}
