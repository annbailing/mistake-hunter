import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  Tag,
  FileText,
} from 'lucide-react'
import { mistakeApi } from '../services/api'
import { ERROR_TYPE_MAP, MASTERY_STATUS_MAP } from '../types'
import type { Mistake } from '../types'
import { Skeleton } from '../components/ui/Loading'
import clsx from 'clsx'
import dayjs from 'dayjs'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import DOMPurify from 'dompurify'

/** 去掉答案里 AI 习惯性重复的题目内容和前缀 */
function cleanAnswer(content: string, answer: string): string {
  if (!answer) return answer
  let cleaned = answer
  // 去掉 "解：" "答：" "原式 =" 等前缀
  cleaned = cleaned.replace(/^(解|答|答案)[：:]\s*/i, '')
  cleaned = cleaned.replace(/^原式\s*[=＝]\s*/i, '')
  cleaned = cleaned.replace(/^题目[：:]\s*/i, '')
  // 如果答案开头和题目内容前20个字符相同，裁掉重复部分
  const contentStart = content.replace(/\s+/g, '').slice(0, 20)
  const answerStart = cleaned.replace(/\s+/g, '').slice(0, 20)
  if (contentStart && answerStart && contentStart === answerStart) {
    cleaned = cleaned.slice(content.replace(/\s+/g, '').length)
    cleaned = cleaned.replace(/^[=＝]?\s*/, '')
  }
  return cleaned.trim()
}

function renderLatex(text: string): string {
  if (!text) return text
  let result = text
    // 把字面量 "\n"（反斜杠+n）转为真正的换行符
    .replace(/\\n/g, '\n')

  // 保护公式块，避免换行处理破坏 KaTeX 语法
  const mathBlocks: string[] = []
  result = result
    .replace(/\$\$([^$]+)\$\$/g, (m) => { mathBlocks.push(m); return `\x00MATH${mathBlocks.length - 1}\x00` })
    .replace(/\\\[([\s\S]*?)\\\]/g, (m) => { mathBlocks.push(m); return `\x00MATH${mathBlocks.length - 1}\x00` })
    .replace(/\$([^$]+)\$/g, (m) => { mathBlocks.push(m); return `\x00MATH${mathBlocks.length - 1}\x00` })
    .replace(/\\\(([\s\S]*?)\\\)/g, (m) => { mathBlocks.push(m); return `\x00MATH${mathBlocks.length - 1}\x00` })

  // 换行符 → <br/>（仅在文本区域）
  result = result.replace(/\n/g, '<br/>')

  // 还原公式块并渲染
  result = result.replace(/\x00MATH(\d+)\x00/g, (_, i) => {
    const m = mathBlocks[Number(i)]
    // $$...$$
    if (m.startsWith('$$')) {
      const f = m.slice(2, -2)
      try { return katex.renderToString(f, { displayMode: true, throwOnError: false }) } catch { return m }
    }
    // \[...\]
    if (m.startsWith('\\[')) {
      const f = m.slice(2, -2)
      try { return katex.renderToString(f, { displayMode: true, throwOnError: false }) } catch { return m }
    }
    // $...$
    if (m.startsWith('$')) {
      const f = m.slice(1, -1)
      try { return katex.renderToString(f, { displayMode: false, throwOnError: false }) } catch { return m }
    }
    // \(...\)
    if (m.startsWith('\\(')) {
      const f = m.slice(2, -2)
      try { return katex.renderToString(f, { displayMode: false, throwOnError: false }) } catch { return m }
    }
    return m
  })

  // XSS 防护：清洗 HTML，只允许安全标签（KaTeX 的 span + 基本文本标签）
  return DOMPurify.sanitize(result, {
    ALLOWED_TAGS: ['span', 'br', 'p', 'strong', 'em', 'sub', 'sup', 'table', 'tr', 'td', 'tbody', 'thead', 'th', 'colgroup', 'col'],
    ALLOWED_ATTR: ['class', 'style', 'aria-hidden', 'colspan', 'rowspan'],
  })
}

export default function MistakeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mistake, setMistake] = useState<Mistake | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showVariants, setShowVariants] = useState<Record<string, boolean>>({})

  const fetchMistake = async () => {
    if (!id) return
    try {
      const res = await mistakeApi.getById(id)
      setMistake(res.data.data)
    } catch {
      navigate('/mistakes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMistake()
  }, [id])

  const handleAnalyze = async () => {
    if (!id) return
    setAnalyzing(true)
    try {
      await mistakeApi.analyze(id)
      toast.success('AI分析完成')
      fetchMistake()
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || '分析失败'
      toast.error(`AI分析失败：${msg}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateVariants = async () => {
    if (!id) return
    setGenerating(true)
    try {
      await mistakeApi.generateVariants(id)
      toast.success('变体题生成完成')
      fetchMistake()
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || '生成失败'
      toast.error(`变体题生成失败：${msg}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkMastered = async () => {
    if (!id) return
    try {
      await mistakeApi.markMastered(id)
      toast.success('已标记为掌握')
      fetchMistake()
    } catch {}
  }

  const handleDelete = async () => {
    if (!id || !confirm('确定删除这道错题？此操作不可撤销。')) return
    try {
      await mistakeApi.remove(id)
      toast.success('错题已删除')
      navigate('/mistakes')
    } catch {}
  }

  const toggleVariant = (vid: string) => {
    setShowVariants((prev) => ({ ...prev, [vid]: !prev[vid] }))
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!mistake) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/mistakes"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">{mistake.subject?.icon}</span>
              {mistake.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mistake.subject?.name}
              {mistake.chapter ? ` > ${mistake.chapter.name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/mistakes/${id}/edit`}
            className="btn-secondary gap-1.5"
          >
            <Edit3 className="h-4 w-4" />
            编辑
          </Link>
          {mistake.masteryStatus !== 'mastered' && (
            <button
              onClick={handleMarkMastered}
              className="btn-primary gap-1.5 bg-success-600 hover:bg-success-700"
            >
              <CheckCircle className="h-4 w-4" />
              标记已掌握
            </button>
          )}
          <button
            onClick={handleDelete}
            className="btn-secondary gap-1.5 text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
        </div>
      </div>

      <div className="content-card">
        <h2 className="content-label">
          <BookOpen className="h-4 w-4" />
          题目内容
        </h2>
        <div
          className="content-text prose dark:prose-invert max-w-none whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderLatex(mistake.content) }}
        />
      </div>

      {mistake.myAnswer && (
        <div className="answer-wrong">
          <h2 className="content-label text-danger-600 dark:text-danger-400">
            我的答案
          </h2>
          <p className="content-text whitespace-pre-wrap">
            {mistake.myAnswer}
          </p>
        </div>
      )}

      {mistake.correctAnswer && (
        <div className="answer-correct">
          <h2 className="content-label text-success-600 dark:text-success-400">
            正确答案
          </h2>
          <p className="content-text whitespace-pre-wrap">
            {mistake.correctAnswer}
          </p>
        </div>
      )}

      <div className="content-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI 错因分析
          </h2>
          {!mistake.aiAnalysis && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-primary gap-1.5"
            >
              {analyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {analyzing ? '分析中...' : '开始分析'}
            </button>
          )}
        </div>
        {mistake.aiAnalysis ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {mistake.aiAnalysis.errorType &&
                ERROR_TYPE_MAP[mistake.aiAnalysis.errorType] && (
                  <span
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium',
                      ERROR_TYPE_MAP[mistake.aiAnalysis.errorType].color
                    )}
                  >
                    {ERROR_TYPE_MAP[mistake.aiAnalysis.errorType].label}
                  </span>
                )}
              {mistake.aiAnalysis.modelUsed && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  模型: {mistake.aiAnalysis.modelUsed}
                </span>
              )}
            </div>
            <div className="content-text whitespace-pre-wrap">
              {mistake.aiAnalysis.analysis}
            </div>
            {mistake.aiAnalysis.suggestion && (
              <div className="p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40">
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                  改进建议
                </p>
                <p className="content-text">
                  {mistake.aiAnalysis.suggestion}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            尚未进行AI分析，点击上方按钮开始
          </p>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            变体练习题
          </h2>
          <button
            onClick={handleGenerateVariants}
            disabled={generating}
            className="btn-secondary gap-1.5"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {generating ? '生成中...' : '重新生成'}
          </button>
        </div>
        {mistake.variantQuestions?.length > 0 ? (
          <div className="space-y-3">
            {mistake.variantQuestions.map((v: any, i: number) => (
              <div
                key={v.id}
                className="content-card !p-4"
              >
                <p
                  className="content-text font-medium mb-3 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: `${i + 1}. ${renderLatex(v.content)}` }}
                />
                <button
                  onClick={() => toggleVariant(v.id)}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium transition-colors"
                >
                  {showVariants[v.id] ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      收起答案
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      查看答案
                    </>
                  )}
                </button>
                {showVariants[v.id] && (
                  <div
                    className="mt-3 content-card !p-4 content-text whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderLatex(cleanAnswer(v.content, v.answer)) }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            暂无变体题
          </p>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          详细信息
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">科目：</span>
            <span className="text-gray-900 dark:text-gray-100">
              {mistake.subject?.icon} {mistake.subject?.name}
            </span>
          </div>
          {mistake.chapter && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">章节：</span>
              <span className="text-gray-900 dark:text-gray-100">
                {mistake.chapter.name}
              </span>
            </div>
          )}
          {mistake.source && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">来源：</span>
              <span className="text-gray-900 dark:text-gray-100">
                {mistake.source}
              </span>
            </div>
          )}
          {mistake.sourceDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">日期：</span>
              <span className="text-gray-900 dark:text-gray-100">
                {dayjs(mistake.sourceDate).format('YYYY-MM-DD')}
              </span>
            </div>
          )
          }
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">状态：</span>
            {MASTERY_STATUS_MAP[mistake.masteryStatus] && (
              <span
                className={clsx(
                  'text-xs px-2 py-0.5 rounded-full',
                  MASTERY_STATUS_MAP[mistake.masteryStatus].color
                )}
              >
                {MASTERY_STATUS_MAP[mistake.masteryStatus].label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">录入时间：</span>
            <span className="text-gray-900 dark:text-gray-100">
              {dayjs(mistake.createdAt).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>
        </div>
        {mistake.mistakeTags?.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              标签：
            </span>
            {mistake.mistakeTags.map((t: any) => (
              <span
                key={t.tag.id}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
