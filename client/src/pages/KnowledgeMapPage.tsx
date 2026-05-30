import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { statsApi } from '../services/api'
import type { KnowledgeWeaknessData } from '../types'
import { Skeleton } from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import { Map } from 'lucide-react'

export default function KnowledgeMapPage() {
  const [data, setData] = useState<KnowledgeWeaknessData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState<string>('all')

  useEffect(() => {
    statsApi
      .getKnowledgeWeakness()
      .then((r) => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getColor = (count: number) => {
    if (count >= 8)
      return 'border-danger-500 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300'
    if (count >= 3)
      return 'border-warning-500 bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300'
    return 'border-success-500 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300'
  }

  const getDotColor = (count: number) => {
    if (count >= 8) return 'bg-danger-500'
    if (count >= 3) return 'bg-warning-500'
    return 'bg-success-500'
  }

  const filteredData =
    activeSubject === 'all'
      ? data
      : data.filter((d) => d.subject === activeSubject)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          知识地图
        </h1>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-danger-500" />
            <span className="text-gray-600 dark:text-gray-400">
              8道以上 薄弱
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-warning-500" />
            <span className="text-gray-600 dark:text-gray-400">
              3-7道 一般
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-success-500" />
            <span className="text-gray-600 dark:text-gray-400">
              2道以下 掌握
            </span>
          </span>
        </div>
      </div>

      {data.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubject('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSubject === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            全部科目
          </button>
          {data.map((node) => (
            <button
              key={node.subject}
              onClick={() => setActiveSubject(node.subject)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSubject === node.subject
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {node.subject}
              <span className="ml-1.5 text-xs opacity-70">
                ({node.chapters.reduce((s, c) => s + c.mistakeCount, 0)})
              </span>
            </button>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={<Map className="h-16 w-16" />}
          title="暂无知识地图数据"
          description="请先录入一些错题，系统将自动为你生成知识薄弱点分析"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((node, i) => {
            const totalMistakes = node.chapters.reduce(
              (s, c) => s + c.mistakeCount,
              0
            )
            return (
              <div
                key={i}
                className="card p-5 hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  {node.subject}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  共 {totalMistakes} 道错题
                </p>
                <div className="space-y-2">
                  {node.chapters.map((ch, j) => (
                    <Link
                      key={j}
                      to={`/mistakes?keyword=${encodeURIComponent(ch.name)}`}
                      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getColor(
                        ch.mistakeCount
                      )} hover:opacity-80 transition-opacity`}
                    >
                      <span className="text-sm font-medium">{ch.name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${getDotColor(
                            ch.mistakeCount
                          )}`}
                        />
                        <span className="text-sm font-bold tabular-nums">
                          {ch.mistakeCount}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {node.chapters.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                      暂无章节数据
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
