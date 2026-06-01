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
  const [chapterName, setChapterName] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [source, setSource] = useState('')
  const [sourceDate, setSourceDate] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<Array<{ id: string; filePath: string }>>([])
  const [ocrResult, setOcrResult] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [newTagName, setNewTagName] = useState('')

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
        setChapterName(m.chapter?.name || '')
        setSelectedTags(m.mistakeTags?.map((t: any) => t.tag.id) || [])
        setSource(m.source || '')
        setSourceDate(m.sourceDate ? m.sourceDate.split('T')[0] : '')
        setExistingImages(m.images || [])
      }).catch(() => navigate('/mistakes'))
    }
  }, [id])

  // 内联创建新标签
  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    try {
      const res = await tagApi.create({ name })
      setTags((prev) => [...prev, res.data.data])
      setSelectedTags((prev) => [...prev, res.data.data.id])
      setNewTagName('')
      toast.success('标签已创建')
    } catch {}
  }

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
      if (chapterName.trim()) form.append('chapterName', chapterName.trim())
      if (myAnswer) form.append('myAnswer', myAnswer)
      if (correctAnswer) form.append('correctAnswer', correctAnswer)
      if (source) form.append('source', source)
      if (sourceDate) form.append('sourceDate', sourceDate)
      selectedTags.forEach((t) => form.append('tagIds[]', t))
      images.forEach((img) => form.append('images', img))
      existingImages.forEach((img) => form.append('keepImageIds[]', img.id))

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
        {/* 🖼️ 题目图片管理区域（创建与编辑均可见，且支持多图预览/删除） */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-sm font-medium mb-1">🖼️ 题目图片</h2>

          {/* 1. 已有图片展示（仅在编辑模式且有图片时显示） */}
          {isEdit && existingImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">已有图片（点击右上角 × 删除）：</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <img src={img.filePath} alt="已有图片" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setExistingImages((prev) => prev.filter((x) => x.id !== img.id))}
                      className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors focus:outline-none text-xs font-bold"
                      title="删除此图"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. 新图上传区 */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center bg-gray-50/50 dark:bg-gray-900/10">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages((prev) => [...prev, ...Array.from(e.target.files || [])])}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer block">
              <p className="text-3xl mb-1">📸</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">点击上传或拖拽图片到此处</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">支持 JPG/PNG，最多可上传 5 张</p>
            </label>
          </div>

          {/* 3. 新选择的图片预览 */}
          {images.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">新选图片（点击右上角 × 取消）：</p>
              <div className="flex flex-wrap gap-3">
                {images.map((file, idx) => {
                  const objectUrl = URL.createObjectURL(file);
                  return (
                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <img src={objectUrl} alt="新选图片" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-gray-800/80 hover:bg-gray-850 text-white rounded-full transition-colors focus:outline-none text-xs font-bold"
                        title="移除此图"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* OCR 识别按钮（仅在非编辑模式且开启拍照录入时显示） */}
              {!isEdit && mode === 'photo' && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleOCR}
                    disabled={ocrLoading}
                     className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm disabled:opacity-50 font-medium transition-colors"
                  >
                    {ocrLoading ? '识别中...' : '🔍 OCR 识别第一张图片'}
                  </button>
                  {ocrResult && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">OCR 识别结果（已同步至题目内容，可手动微调）：</p>
                      <textarea
                        value={ocrResult}
                        onChange={(e) => {
                          setOcrResult(e.target.value);
                          setContent(e.target.value);
                        }}
                        className="w-full h-32 p-2 text-sm bg-transparent border-0 resize-none focus:outline-none text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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
              <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setChapterName('') }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">选择科目</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">📂 章节</label>
              <input type="text" value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                placeholder="如：第一章 极限、排序算法、虚拟内存..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">🏷️ 标签（点击选择 / 输入新建）</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((t) => (
                <button key={t.id} type="button"
                  onClick={() => setSelectedTags((s) => s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id])}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(t.id) ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                  {t.color ? <span className="mr-1">{t.color}</span> : null}
                  {t.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                placeholder="输入新标签名，回车创建"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              <button type="button" onClick={handleCreateTag}
                className="px-3 py-1.5 text-xs rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 transition-colors">
                + 新建
              </button>
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
