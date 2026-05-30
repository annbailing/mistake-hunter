export interface User {
  id: string
  phone: string
  nickname: string
  avatarUrl: string | null
  gradeLevel: string
  grade: string | null
}

export interface Subject {
  id: string
  name: string
  icon: string
  sortOrder: number
  isPreset: boolean
  chapters: Chapter[]
}

export interface Chapter {
  id: string
  name: string
  level: number
  parentId: string | null
  sortOrder: number
  children?: Chapter[]
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Mistake {
  id: string
  userId: string
  subjectId: string
  chapterId: string | null
  title: string
  content: string
  myAnswer: string | null
  correctAnswer: string | null
  source: string | null
  sourceDate: string | null
  errorType: string | null
  masteryStatus: string
  masteredAt: string | null
  createdAt: string
  updatedAt: string
  subject: { id: string; name: string; icon: string }
  chapter: { id: string; name: string } | null
  mistakeTags: { tag: Tag }[]
  tags?: Tag[]
  images: MistakeImage[]
  aiAnalysis: AIAnalysis | null
  variantQuestions: VariantQuestion[]
  reviewSchedules: ReviewSchedule[]
}

export interface MistakeImage {
  id: string
  filePath: string
  thumbnailPath: string | null
  ocrText: string | null
  sortOrder: number
}

export interface AIAnalysis {
  id: string
  errorType: string
  analysis: string
  suggestion: string | null
  modelUsed: string | null
}

export interface VariantQuestion {
  id: string
  content: string
  answer: string
  difficulty: number
  sortOrder: number
  variantAnswers?: VariantAnswer[]
}

export interface VariantAnswer {
  id: string
  myAnswer: string
  isCorrect: boolean
  answeredAt: string
}

export interface ReviewSchedule {
  id: string
  reviewDate: string
  reviewRound: number
  status: string
  feedback: string | null
  mistake: {
    id: string
    title: string
    content: string
    myAnswer: string | null
    correctAnswer: string | null
    errorType: string | null
    subject: { name: string; icon: string }
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SummaryData {
  todayNew: number
  pendingReview: number
  mastered: number
  streak: number
  totalMistakes?: number
  totalReviews?: number
}

export interface TrendData {
  date: string
  newCount: number
  masteredCount: number
  masteryRate: number
}

export interface ErrorTypeData {
  errorType: string
  label: string
  count: number
}

export interface KnowledgeWeaknessData {
  subject: string
  chapters: {
    name: string
    mistakeCount: number
  }[]
}

export const ERROR_TYPE_MAP: Record<string, { label: string; color: string }> = {
  concept: { label: '概念混淆', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  compute: { label: '计算失误', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  read: { label: '审题不清', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  forget: { label: '知识点遗忘', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  method: { label: '解题方法错误', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
}

export const MASTERY_STATUS_MAP: Record<string, { label: string; color: string }> = {
  unmastered: { label: '未掌握', color: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300' },
  reviewing: { label: '复习中', color: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300' },
  mastered: { label: '已掌握', color: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' },
}

export const GRADE_LEVEL_MAP: Record<string, string> = {
  elementary: '小学',
  junior: '初中',
  senior: '高中',
  university: '大学',
}
