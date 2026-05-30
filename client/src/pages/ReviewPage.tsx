import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { reviewApi } from '../services/api'
import { ERROR_TYPE_MAP, MASTERY_STATUS_MAP } from '../types'
import type { ReviewSchedule } from '../types'
import { Skeleton } from '../components/ui/Loading'
import clsx from 'clsx'
import { CheckCircle, RotateCcw, XCircle, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewSchedule[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAnswer, setShowAnswer] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchToday = async () => {
    try {
      const res = await reviewApi.getToday()
      setItems(res.data.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchToday()
  }, [])

  const current = items[currentIndex]
  const total = items.length

  const handleFeedback = async (feedback: string) => {
    if (!current || submitting) return
    setSubmitting(true)
    try {
      await reviewApi.complete(current.id, feedback)
      const messages: Record<string, string> = {
        mastered: '已掌握，继续加油！',
        fuzzy: '稍后会再次复习',
        forgot: '已加入重新复习队列',
      }
      toast.success(messages[feedback] || '已提交')
      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      } else {
        setCurrentIndex(total)
      }
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 rounded-full" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success-100 dark:bg-success-900/20 mb-4">
          <CheckCircle className="h-10 w-10 text-success-600 dark:text-success-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          今日无待复习错题
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          太棒了！继续保持，明天见！
        </p>
      </div>
    )
  }

  if (currentIndex >= total) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-4">
          <PartyPopper className="h-10 w-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          今日复习完成！
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          共复习 {total} 道错题，继续保持！
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          刷新查看
        </button>
      </div>
    )
  }

  const progress = ((currentIndex) / total) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">
          今日复习
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {currentIndex + 1} / {total}
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="content-card space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-base">{current.mistake.subject?.icon}</span>
          <span className="text-slate-600 dark:text-slate-400">
            {current.mistake.subject?.name}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            第 {current.reviewRound} 轮复习
          </span>
          {current.mistake.errorType && ERROR_TYPE_MAP[current.mistake.errorType] && (
            <span
              className={clsx(
                'text-xs px-2 py-0.5 rounded-full',
                ERROR_TYPE_MAP[current.mistake.errorType].color
              )}
            >
              {ERROR_TYPE_MAP[current.mistake.errorType].label}
            </span>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="content-text whitespace-pre-wrap">
            {current.mistake.content}
          </p>
        </div>

        {current.mistake.myAnswer && (
          <div className="answer-wrong !p-4">
            <p className="content-label text-danger-600 dark:text-danger-400 !mb-2">
              当时我的答案：
            </p>
            <p className="content-text whitespace-pre-wrap">
              {current.mistake.myAnswer}
            </p>
          </div>
        )}

        {showAnswer ? (
          <div className="space-y-4">
            <div className="answer-correct !p-4">
              <p className="content-label text-success-600 dark:text-success-400 !mb-2">
                正确答案：
              </p>
              <p className="content-text whitespace-pre-wrap">
                {current.mistake.correctAnswer}
              </p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              你现在掌握了吗？
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleFeedback('mastered')}
                disabled={submitting}
                className="flex flex-col items-center gap-2 py-4 bg-success-50 hover:bg-success-100 dark:bg-success-900/20 dark:hover:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-xl transition-colors"
              >
                <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
                <span className="text-sm font-medium text-success-700 dark:text-success-300">
                  已掌握
                </span>
              </button>
              <button
                onClick={() => handleFeedback('fuzzy')}
                disabled={submitting}
                className="flex flex-col items-center gap-2 py-4 bg-warning-50 hover:bg-warning-100 dark:bg-warning-900/20 dark:hover:bg-warning-900/30 border border-warning-200 dark:border-warning-800 rounded-xl transition-colors"
              >
                <RotateCcw className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                <span className="text-sm font-medium text-warning-700 dark:text-warning-300">
                  还模糊
                </span>
              </button>
              <button
                onClick={() => handleFeedback('forgot')}
                disabled={submitting}
                className="flex flex-col items-center gap-2 py-4 bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/20 dark:hover:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl transition-colors"
              >
                <XCircle className="h-6 w-6 text-danger-600 dark:text-danger-400" />
                <span className="text-sm font-medium text-danger-700 dark:text-danger-300">
                  忘了
                </span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAnswer(true)}
            className="btn-primary w-full py-3.5"
          >
            显示答案
          </button>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1)
              setShowAnswer(false)
            }
          }}
          disabled={currentIndex === 0}
          className="btn-secondary gap-1.5 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          上一题
        </button>
        <button
          onClick={() => {
            if (currentIndex < total - 1) {
              setCurrentIndex(currentIndex + 1)
              setShowAnswer(false)
            }
          }}
          disabled={currentIndex >= total - 1}
          className="btn-secondary gap-1.5 disabled:opacity-50"
        >
          下一题
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
