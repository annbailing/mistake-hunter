import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({
  current,
  total,
  pageSize,
  onChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pages: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(totalPages - 1, current + 1);
      i++
    ) {
      pages.push(i)
    }
    if (current < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:text-gray-400"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((page, idx) =>
        typeof page === 'string' ? (
          <span key={`dots-${idx}`} className="px-2 text-gray-400 select-none">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={clsx(
              'min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors',
              page === current
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= totalPages}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:text-gray-400"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
