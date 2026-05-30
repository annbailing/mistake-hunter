import type { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  padding = true,
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm',
        padding && 'p-6',
        hover &&
          'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-all',
        className
      )}
    >
      {children}
    </div>
  )
}
