import type { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  color?: string
  variant?: 'solid' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

const defaultColors: Record<string, { solid: string; outline: string }> = {
  primary: {
    solid:
      'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    outline: 'border-primary-300 text-primary-700 dark:text-primary-300',
  },
  success: {
    solid:
      'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
    outline: 'border-success-300 text-success-700 dark:text-success-300',
  },
  warning: {
    solid:
      'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
    outline: 'border-warning-300 text-warning-700 dark:text-warning-300',
  },
  danger: {
    solid:
      'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
    outline: 'border-danger-300 text-danger-700 dark:text-danger-300',
  },
  gray: {
    solid:
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    outline: 'border-gray-300 text-gray-700 dark:text-gray-300',
  },
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Badge({
  children,
  color = 'primary',
  variant = 'solid',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const colors = defaultColors[color] || defaultColors.primary

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        variant === 'outline' && 'border',
        colors[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
