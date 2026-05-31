/**
 * jsonExtractor 测试
 *
 * 测试目标：提取 AI 返回的各种不规范 JSON
 *
 * 这是整个项目最关键的解析函数。AI 模型返回的格式五花八门：
 * - 带 markdown 代码块
 * - LaTeX 数学公式里的反斜杠（\int \frac \sqrt 等）
 * - 单引号代双引号
 * - 前后夹带闲聊文字
 * - 甚至直接返回纯文本
 *
 * 运行方法：cd server && npm test
 */
import { describe, it, expect } from "vitest"
import { extractJson } from "../../utils/jsonExtractor"

describe("extractJson — AI 返回 JSON 解析", () => {

  // ============================================================
  //  基础场景：正常 JSON
  // ============================================================
  describe("正常 JSON", () => {

    it("解析最简单的对象", () => {
      const result = extractJson('{"name":"张三","age":20}')
      expect(result).toEqual({ name: "张三", age: 20 })
    })

    it("解析数组", () => {
      const result = extractJson('[{"a":1},{"b":2}]')
      expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it("解析嵌套对象", () => {
      const result = extractJson('{"data":{"items":[1,2,3]},"total":3}')
      expect(result).toEqual({ data: { items: [1, 2, 3] }, total: 3 })
    })
  })

  // ============================================================
  //  场景一：AI 经常返回 markdown 代码块
  // ============================================================
  describe("Markdown 代码块包裹", () => {

    it("去掉 ```json ... ``` 包裹", () => {
      const result = extractJson('```json\n{"error_type":"concept"}\n```')
      expect(result).toEqual({ error_type: "concept" })
    })

    it("去掉 ``` ... ``` 包裹（没有 json 标记）", () => {
      const result = extractJson('```\n{"ok":true}\n```')
      expect(result).toEqual({ ok: true })
    })

    it("前后有闲聊文字也能提取 JSON", () => {
      const input = `好的，我来分析一下这道题。

\`\`\`json
{
  "error_type": "compute",
  "analysis": "你计算错了",
  "suggestion": "多练习"
}
\`\`\`

希望这个分析对你有帮助！`
      const result = extractJson<{ error_type: string; analysis: string }>(input)
      expect(result.error_type).toBe("compute")
      expect(result.analysis).toBe("你计算错了")
    })
  })

  // ============================================================
  //  场景二：LaTeX 数学公式 —— 最常见的解析失败原因
  // ============================================================
  describe("LaTeX 公式里的反斜杠转义（核心坑点）", () => {

    it("修复 \\int \\frac 等 LaTeX 命令", () => {
      // AI 输出的 JSON 里 \int \frac 在 JSON 标准里是非法转义
      // 我们期望它被自动修复为 \\int \\frac
      const input = `{"content":"求 $\\int \\frac{3}{x^3+1}dx$ 的值"}`
      const result = extractJson<{ content: string }>(input)
      expect(result.content).toContain("\\int")
      expect(result.content).toContain("\\frac")
    })

    it("修复 \\sqrt \\boxed 命令", () => {
      const input = `{"content":"$\\sqrt{x^2+y^2}$ 和 $\\boxed{42}$"}`
      const result = extractJson<{ content: string }>(input)
      expect(result.content).toContain("\\sqrt")
      expect(result.content).toContain("\\boxed")
    })

    it("修复 \\arctan \\ln 命令", () => {
      const input = `{"content":"$\\arctan(\\ln x)$"}`
      const result = extractJson<{ content: string }>(input)
      expect(result.content).toContain("\\arctan")
      expect(result.content).toContain("\\ln")
    })

    it("修复多道数学题中包含的各种 LaTeX 命令", () => {
      const input = `{"content":"求 $\\int_0^1 \\frac{x^2}{\\sqrt{1-x^3}}dx$"}`
      const result = extractJson<{ content: string }>(input)
      expect(result.content).toContain("\\int_0^1")
      expect(result.content).toContain("\\sqrt{1-x^3}")
    })
  })

  // ============================================================
  //  场景三：单引号代双引号
  // ============================================================
  describe("单引号 JSON", () => {

    it("把单引号转成双引号", () => {
      const input = "{'error_type':'concept','analysis':'概念混淆'}"
      const result = extractJson<{ error_type: string }>(input)
      expect(result.error_type).toBe("concept")
    })

    it("混合情况也能处理", () => {
      const input = "{'name':'混合测试','valid':true}"
      const result = extractJson<{ name: string; valid: boolean }>(input)
      expect(result.name).toBe("混合测试")
    })
  })

  // ============================================================
  //  场景四：JSON 嵌入在闲聊文字中
  // ============================================================
  describe("从闲聊文字中提取 JSON", () => {

    it("JSON 前面有文字", () => {
      const input = '给你分析一下：{"error_type":"forget"}'
      const result = extractJson<{ error_type: string }>(input)
      expect(result.error_type).toBe("forget")
    })

    it("JSON 后面有文字", () => {
      const input = '{"error_type":"method"} 这就是分析结果'
      const result = extractJson<{ error_type: string }>(input)
      expect(result.error_type).toBe("method")
    })
  })

  // ============================================================
  //  场景五：边界情况和容错
  // ============================================================
  describe("边界情况", () => {

    it("空对象", () => {
      const result = extractJson("{}")
      expect(result).toEqual({})
    })

    it("末尾多余逗号被修复", () => {
      const input = '{"name":"test","age":18,}'
      const result = extractJson<{ name: string; age: number }>(input)
      // JSON5会去掉尾部逗号，但标准JSON不行
      // 我们的 repairJson 会处理
      expect(result.name).toBe("test")
    })

    it("缺少引号的 key 自动补上", () => {
      const input = '{name:"hello",age:20}'
      const result = extractJson<{ name: string; age: number }>(input)
      expect(result.name).toBe("hello")
      expect(result.age).toBe(20)
    })

    it("无法解析时抛出明确的错误", () => {
      // 传一段完全不是 JSON 的文字
      expect(() => extractJson("我是AI，今天天气真好")).toThrow()
    })
  })
})

// ============================================================
//  describe vs it 新手说明：
//  describe("分组名") — 把一组相关测试包在一起
//  it("测试名")     — 单个测试用例
//  expect(结果).toBe(期望值) — 断言：不匹配就报错
//
//  运行：cd server && npm test
//  看到绿色 ✅ 就是过了，红色 ❌ 就是有 bug
// ============================================================
