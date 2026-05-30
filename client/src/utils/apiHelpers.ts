import type { Mistake, Subject, Tag, User } from '../types'

// ── 所有 API 响应遵循统一格式: { success: boolean, data: T } ──

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

// ── 各端点的 data 具体形状 ──

/** 分页列表 */
export interface PaginatedData<T> {
  list: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/** 认证响应 */
export interface AuthData {
  user: User
  token: string
  refreshToken: string
}

/** 统计摘要 */
export interface SummaryData {
  todayNew: number
  pendingReview: number
  mastered: number
  streak: number
}

// ── 安全提取辅助 ──

/** 从 axios response 提取 data 层，失败返回兜底值 */
export function unwrap<T>(res: { data: ApiEnvelope<T> } | undefined, fallback: T): T {
  return res?.data?.data ?? fallback
}

/** 提取分页列表，兜底空数组 */
export function unwrapList<T>(res: { data: ApiEnvelope<PaginatedData<T>> } | undefined): {
  items: T[]
  total: number
  totalPages: number
} {
  const data = res?.data?.data
  return {
    items: data?.list ?? [],
    total: data?.pagination?.total ?? 0,
    totalPages: data?.pagination?.totalPages ?? 0,
  }
}
