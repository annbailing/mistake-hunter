import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mistakeApi, subjectApi, tagApi, ocrApi } from '../services/api'
import type { Subject, Tag } from '../types'

export default function MistakeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [mode, setMode] = useState<'manual' | 'photo'>('manual')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [myAnswer, setMyAnswer] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [source, setSource] = useState('')
  const [sourceDate, setSourceDate] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [ocrResult, setOcrResult] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  useEffect(() => {
    subjectApi.getAll().then((r) => setSubjects(r.data.data)).catch(() => {})
    tagApi.getAll().then((r) => setTags(r.data.data)).catch(() => {})
    if (isEdit) {
      mistakeApi.getById(id!).then((r) => {
        const m = r.data.data
        setTitle(m.title)
        setContent(m.content)
        setMyAnswer(m.myAnswer || '')
        setCorrectAnswer(m.correctAnswer || '')
        setSubjectId(m.subject?.id || '')
        setChapterId(m.chapter?.id || '')
        setSelectedTags(m.mistakeTags?.map((t: any) => t.tag.id) || [])
        setSource(m.source || '')
        setSourceDate(m.sourceDate ? m.sourceDate.split('T')[0] : '')
      }).catch(() => navigate('/mistakes'))
    }
  }, [id])

  const chapters = subjects.find((s) => s.id === subjectId)?.chapters || []

  const handleOCR = async () => {
    if (images.length === 0) return
    setOcrLoading(true)
    try {
      const res = await ocrApi.recognize(images[0])
      const text = res.data.data.text || ''
      setOcrResult(text)
      if (!content) setContent(text)
      toast.success('OCR 识别完成')
    } catch {} finally { setOcrLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !subjectId) {
      toast.error('请填写必填项')
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('content', content)
      form.append('subjectId', subjectId)
      if (chapterId) form.append('chapterId', chapterId)
      if (myAnswer) form.append('myAnswer', myAnswer)
      if (correctAnswer) form.append('correctAnswer', correctAnswer)
      if (source) form.append('source', source)
      if (sourceDate) form.append('sourceDate', sourceDate)
      selectedTags.forEach((t) => form.append('tagIds[]', t))
      images.forEach((img) => form.append('images', img))

      if (isEdit) {
        await mistakeApi.update(id!, form)
        toast.success('更新成功')
      } else {
        await mistakeApi.create(form)
        toast.success('创建成功')
      }
      navigate('/mistakes')
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{isEdit ? '编辑错题' : '新建错题'}</h1>

      {!isEdit && (
        <div className="flex gap-2">
          <button onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === 'manual' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
            📝 手动输入
          </button>
          <button onClick={() => setMode('photo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === 'photo' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
            📷 拍照录入
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'photo' && !isEdit && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium mb-3">📷 拍照录入</h2>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
              <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="hidden" id="image-upload" />
              <label htmlFor="image-upload" className="cursor-pointer">
                <p className="text-4xl mb-2">📸</p>
                <p className="text-sm text-gray-500">点击上传或拖拽图片到此处</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG，最多5张</p>
              </label>
            </div>
            {images.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600">已选 {images.length} 张图片</p>
                <button type="button" onClick={handleOCR} disabled={ocrLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">
                  {ocrLoading ? '识别中...' : '🔍 OCR 识别'}
                </button>
                {ocrResult && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">识别结果（可编辑）：</p>
                    <textarea value={ocrResult} onChange={(e) => { setOcrResult(e.target.value); setContent(e.target.value) }}
                      className="w-full h-32 p-2 text-sm bg-transparent border-0 resize-none focus:outline-none" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">📐 题目标题 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="输入题目标题"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">📄 题目内容 *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={6}
              placeholder="输入题目内容，支持 Markdown 和 LaTeX"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none resize-y" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">❌ 我的错误答案</label>
            <textarea value={myAnswer} onChange={(e) => setMyAnswer(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none resize-y" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">✅ 正确答案</label>
            <textarea value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none resize-y" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">📚 科目 *</label>
              <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setChapterId('') }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">选择科目</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">📂 章节</label>
              <select value={chapterId} onChange={(e) => setChapterId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">选择章节</option>
                {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">🏷️ 标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button key={t.id} type="button"
                  onClick={() => setSelectedTags((s) => s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id])}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(t.id) ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">📋 来源</label>
              <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="如：月考、练习册P23"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">📅 来源日期</label>
              <input type="date" value={sourceDate} onChange={(e) => setSourceDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/mistakes')}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            取消
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
