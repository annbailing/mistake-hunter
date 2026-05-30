import type { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
  onClick?: () => void
  solid?: boolean
}

export default function Card({
  children,
  className = '',
  padding = true,
  hover = false,
  onClick,
  solid = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        solid ? 'content-card' : 'card',
        padding && 'p-6',
        hover &&
          'hover:shadow-lg hover:border-indigo-200/60 dark:hover:border-indigo-500/30 cursor-pointer transition-all',
        className
      )}
    >
      {children}
    </div>
  )
}
