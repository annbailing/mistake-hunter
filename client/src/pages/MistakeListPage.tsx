import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Plus, Trash2, Filter } from 'lucide-react'
import { mistakeApi, subjectApi, tagApi } from '../services/api'
import { ERROR_TYPE_MAP, MASTERY_STATUS_MAP } from '../types'
import type { Mistake, Subject, Tag } from '../types'
import { SkeletonCard } from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { unwrapList } from '../utils/apiHelpers'
import clsx from 'clsx'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

export default function MistakeListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])

  const page = Number(searchParams.get('page') || 1)
  const subjectId = searchParams.get('subjectId') || ''
  const errorType = searchParams.get('errorType') || ''
  const masteryStatus = searchParams.get('masteryStatus') || ''
  const tagId = searchParams.get('tagId') || ''
  const keyword = searchParams.get('keyword') || ''
  const [searchInput, setSearchInput] = useState(keyword)
  const limit = 12

  const fetchMistakes = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit }
      if (subjectId) params.subjectId = subjectId
      if (errorType) params.errorType = errorType
      if (masteryStatus) params.masteryStatus = masteryStatus
      if (tagId) params.tagId = tagId
      if (keyword) params.keyword = keyword
      const res = await mistakeApi.getList(params)
      const { items, total: t, totalPages: tp } = unwrapList<Mistake>(res)
      setMistakes(items)
      setTotal(t)
      setTotalPages(tp)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMistakes()
  }, [page, subjectId, errorType, masteryStatus, tagId, keyword])

  useEffect(() => {
    setSearchInput(keyword)
  }, [keyword])

  useEffect(() => {
    subjectApi.getAll().then((r) => setSubjects(r.data.data || [])).catch(() => {})
    tagApi.getAll().then((r) => setTags(r.data.data || [])).catch(() => {})
  }, [])

  const updateParams = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    if (key !== 'page') p.set('page', '1')
    setSearchParams(p)
  }

  const handleSearch = () => {
    updateParams('keyword', searchInput)
  }

  const handleBatchDelete = async () => {
    if (selected.length === 0) return
    if (!confirm(`确定删除选中的 ${selected.length} 道错题？此操作不可撤销。`)) return
    try {
      await mistakeApi.batchRemove(selected)
      toast.success(`成功删除 ${selected.length} 道错题`)
      setSelected([])
      fetchMistakes()
    } catch {}
  }

  const toggleSelect = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === mistakes.length) {
      setSelected([])
    } else {
      setSelected(mistakes.map((m) => m.id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">
          错题管理
        </h1>
        <Link
          to="/mistakes/new"
          className="btn-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          新建错题
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索错题标题或内容..."
              className="input pl-9"
            />
          </div>

          <select
            value={subjectId}
            onChange={(e) => updateParams('subjectId', e.target.value)}
            className="select"
          >
            <option value="">全部科目</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>

          <select
            value={errorType}
            onChange={(e) => updateParams('errorType', e.target.value)}
            className="select"
          >
            <option value="">全部错因</option>
            {Object.entries(ERROR_TYPE_MAP).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            value={tagId}
            onChange={(e) => updateParams('tagId', e.target.value)}
            className="select"
          >
            <option value="">全部标签</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                🏷️ {t.name}
              </option>
            ))}
          </select>

          <select
            value={masteryStatus}
            onChange={(e) => updateParams('masteryStatus', e.target.value)}
            className="select"
          >
            <option value="">全部状态</option>
            {Object.entries(MASTERY_STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <input
            type="checkbox"
            checked={selected.length === mistakes.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded accent-primary-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            已选 {selected.length} 项
          </span>
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 text-sm text-danger-600 hover:text-danger-700 font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            批量删除
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : mistakes.length === 0 ? (
        <EmptyState
          title="暂无错题"
          description="开始录入你的第一道错题，让AI帮你分析和巩固"
          action={{
            label: '录入错题',
            onClick: () => {},
            to: '/mistakes/new',
          }}
        />
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => (
            <div
              key={m.id}
              className="card p-4 hover:shadow-md transition-shadow flex items-start gap-3"
            >
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggleSelect(m.id)}
                className="mt-1 w-4 h-4 rounded accent-primary-600 flex-shrink-0"
              />
              <Link to={`/mistakes/${m.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{m.subject?.icon}</span>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {m.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {m.subject?.name}
                  {m.chapter ? ` > ${m.chapter.name}` : ''}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.errorType && ERROR_TYPE_MAP[m.errorType] && (
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full',
                        ERROR_TYPE_MAP[m.errorType].color
                      )}
                    >
                      {ERROR_TYPE_MAP[m.errorType].label}
                    </span>
                  )}
                  {m.masteryStatus && MASTERY_STATUS_MAP[m.masteryStatus] && (
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full',
                        MASTERY_STATUS_MAP[m.masteryStatus].color
                      )}
                    >
                      {MASTERY_STATUS_MAP[m.masteryStatus].label}
                    </span>
                  )}
                  {m.mistakeTags?.map((t) => (
                    <span
                      key={t.tag.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </Link>
              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {dayjs(m.createdAt).format('YYYY-MM-DD')}
              </span>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            current={page}
            total={total}
            pageSize={limit}
            onChange={(p) => updateParams('page', String(p))}
          />
        </div>
      )}
    </div>
  )
}
