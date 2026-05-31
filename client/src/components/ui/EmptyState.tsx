import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    to?: string
  }
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-4 text-gray-300 dark:text-gray-600">
        {icon || <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && (
        action.to ? (
          <Link to={action.to} className="btn-primary gap-2">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary gap-2">
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
