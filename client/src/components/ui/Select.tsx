import { type SelectHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-400',
            error &&
              'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
