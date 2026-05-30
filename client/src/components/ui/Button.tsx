import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  to?: string
}

const variantClasses: Record<string, string> = {
  primary:
    'text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 btn-primary',
  secondary: 'btn-secondary focus:ring-gray-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-white/50 focus:ring-gray-400 dark:text-slate-300 dark:hover:bg-white/6 rounded-full',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 dark:bg-danger-500 dark:hover:bg-danger-600 rounded-full',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      to,
      children,
      ...props
    },
    ref
  ) => {
    const classes = clsx(
      'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      className
    )

    if (to) {
      return (
        <Link to={to} className={classes}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
