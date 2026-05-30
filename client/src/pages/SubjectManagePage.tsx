import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronRight, ChevronDown, BookOpen, FolderPlus } from 'lucide-react'
import { subjectApi } from '../services/api'
import type { Subject, Chapter } from '../types'
import { Skeleton } from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import clsx from 'clsx'

export default function SubjectManagePage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddChapter, setShowAddChapter] = useState<string | null>(null)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [chapterName, setChapterName] = useState('')

  const fetchSubjects = async () => {
    try {
      const res = await subjectApi.getAll()
      setSubjects(res.data.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const handleAddSubject = async () => {
    if (!newName.trim()) {
      toast.error('请输入科目名称')
      return
    }
    try {
      await subjectApi.create({ name: newName.trim(), icon: newIcon || undefined })
      toast.success('科目创建成功')
      setNewName('')
      setNewIcon('')
      setShowAddSubject(false)
      fetchSubjects()
    } catch {}
  }

  const handleAddChapter = async (subjectId: string) => {
    if (!chapterName.trim()) {
      toast.error('请输入章节名称')
      return
    }
    try {
      await subjectApi.createChapter(subjectId, { name: chapterName.trim() })
      toast.success('章节创建成功')
      setChapterName('')
      setShowAddChapter(null)
      fetchSubjects()
    } catch {}
  }

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`确定删除科目「${name}」？关联的错题不会被删除。`)) return
    try {
      await subjectApi.remove(id)
      toast.success('科目已删除')
      fetchSubjects()
    } catch {}
  }

  const toggleExpand = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const emojiIcons = ['Math', 'Book', 'Globe', 'Flask', 'Music', 'Palette', 'Code', 'Dumbbell', 'Languages', 'Calculator']

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          科目管理
        </h1>
        <button
          onClick={() => setShowAddSubject(true)}
          className="btn-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          新增科目
        </button>
      </div>

      <Modal
        open={showAddSubject}
        onClose={() => {
          setShowAddSubject(false)
          setNewName('')
          setNewIcon('')
        }}
        title="新增科目"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              图标（可选）
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {emojiIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 transition-colors',
                    newIcon === icon
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {icon === 'Math' ? '📐' : icon === 'Book' ? '📚' : icon === 'Globe' ? '🌍' : icon === 'Flask' ? '🧪' : icon === 'Music' ? '🎵' : icon === 'Palette' ? '🎨' : icon === 'Code' ? '💻' : icon === 'Dumbbell' ? '🏃' : icon === 'Languages' ? '🔤' : '📊'}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="自定义图标"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              科目名称 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="输入科目名称"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowAddSubject(false)
                setNewName('')
                setNewIcon('')
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleAddSubject} className="btn-primary">
              添加
            </button>
          </div>
        </div>
      </Modal>

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-16 w-16" />}
          title="暂无科目"
          description="添加你的第一个科目，开始管理错题吧"
          action={{
            label: '添加科目',
            onClick: () => setShowAddSubject(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => {
            const isExpanded = expandedSubjects.has(subject.id)
            return (
              <div
                key={subject.id}
                className="card overflow-hidden"
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(subject.id)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <span className="text-2xl">{subject.icon}</span>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subject.name}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {subject.chapters?.length || 0} 个章节
                        {subject.isPreset && ' · 预置科目'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowAddChapter(
                          showAddChapter === subject.id ? null : subject.id
                        )
                        setChapterName('')
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    >
                      <FolderPlus className="h-4 w-4" />
                      添加章节
                    </button>
                    {!subject.isPreset && (
                      <button
                        onClick={() =>
                          handleDeleteSubject(subject.id, subject.name)
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </button>
                    )}
                  </div>
                </div>

                {showAddChapter === subject.id && (
                  <div className="px-5 pb-4 flex gap-2">
                    <input
                      type="text"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                      placeholder="输入章节名称"
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleAddChapter(subject.id)
                      }
                      className="flex-1 input"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddChapter(subject.id)}
                      className="btn-primary"
                    >
                      添加
                    </button>
                    <button
                      onClick={() => setShowAddChapter(null)}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                  </div>
                )}

                {isExpanded && (
                  <div className="px-5 pb-5">
                    {subject.chapters?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {subject.chapters.map((ch: Chapter) => (
                          <span
                            key={ch.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg"
                          >
                            {ch.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                        暂无章节，点击上方按钮添加
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
