import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, RotateCcw } from 'lucide-react'
import {
  DEFAULT_LOGIN_BG,
  getLoginBackground,
  readImageAsDataUrl,
  resetLoginBackground,
  setLoginBackground,
} from '../../utils/authBackground'

interface AuthShellProps {
  subtitle: string
  children: React.ReactNode
}

export function AuthShell({ subtitle, children }: AuthShellProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bgUrl, setBgUrl] = useState(getLoginBackground)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return

    const dataUrl = await readImageAsDataUrl(file)
    setLoginBackground(dataUrl)
    setBgUrl(dataUrl)
    e.target.value = ''
  }

  const handleResetBg = () => {
    resetLoginBackground()
    setBgUrl(DEFAULT_LOGIN_BG)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-[background-image] duration-700"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {/* 极轻遮罩，保留背景通透感 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />

      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        {bgUrl !== DEFAULT_LOGIN_BG && (
          <button
            type="button"
            onClick={handleResetBg}
            title="恢复默认背景"
            className="bubble-btn-icon"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="更换背景图片"
          className="bubble-btn-icon gap-1.5 px-3"
        >
          <ImagePlus className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">换背景</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-10">
        <div className="text-center mb-8">
          <h1
            className="text-3xl sm:text-4xl font-light text-white tracking-[0.15em] mb-3"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            错题猎人
          </h1>
          <div className="w-10 h-px bg-white/35 mx-auto mb-3" />
          <p
            className="text-white/65 text-sm font-light tracking-wide"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}
          >
            {subtitle}
          </p>
        </div>

        <div className="bubble-panel">{children}</div>

        <p
          className="text-center mt-6 text-xs text-white/40 font-light"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
        >
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  )
}

export function AuthTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-light text-white/90 mb-7 text-center tracking-widest"
      style={{ textShadow: '0 1px 8px rgba(0,0,0,0.35)' }}
    >
      {children}
    </h2>
  )
}

export function AuthInput({
  label,
  focused,
  onFocus,
  onBlur,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  focused: boolean
}) {
  return (
    <div className="space-y-2">
      <label
        className="text-sm font-light text-white/75 tracking-wide pl-1"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
      >
        {label}
      </label>
      <input
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`bubble-input ${focused ? 'bubble-input-focused' : ''} ${className}`}
      />
    </div>
  )
}

export function AuthSelect({
  label,
  children,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className="space-y-2">
      <label
        className="text-sm font-light text-white/75 tracking-wide pl-1"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
      >
        {label}
      </label>
      <select {...props} className={`bubble-input bubble-select ${className}`}>
        {children}
      </select>
    </div>
  )
}

export function AuthSubmitButton({
  loading,
  children,
}: {
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <button type="submit" disabled={loading} className="bubble-btn-primary w-full mt-2">
      {children}
    </button>
  )
}

export function AuthLink({
  text,
  linkText,
  to,
}: {
  text: string
  linkText: string
  to: string
}) {
  return (
    <p
      className="text-center mt-7 text-sm text-white/50 font-light"
      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
    >
      {text}
      <Link
        to={to}
        className="text-white/80 hover:text-white font-normal ml-1.5 transition-colors hover:underline underline-offset-4"
      >
        {linkText}
      </Link>
    </p>
  )
}
