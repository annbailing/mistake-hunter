import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { GRADE_LEVEL_MAP } from '../types'
import {
  AuthShell,
  AuthTitle,
  AuthInput,
  AuthSelect,
  AuthSubmitButton,
  AuthLink,
} from '../components/auth/AuthShell'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [gradeLevel, setGradeLevel] = useState('junior')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inputFocused, setInputFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !password || !nickname) {
      toast.error('请填写所有必填项')
      return
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      toast.error('密码长度不能少于6位')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        phone,
        password,
        nickname,
        grade_level: gradeLevel,
      })
      const { token, refreshToken, user } = res.data.data
      setAuth(token, refreshToken, user)
      toast.success('注册成功')
      navigate('/')
    } catch {
      toast.error('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell subtitle="创建账号，开启智能学习之旅">
      <AuthTitle>注册账号</AuthTitle>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="手机号"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onFocus={() => setInputFocused('phone')}
          onBlur={() => setInputFocused(null)}
          focused={inputFocused === 'phone'}
          placeholder="请输入手机号"
          required
          maxLength={11}
        />

        <AuthInput
          label="昵称"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onFocus={() => setInputFocused('nickname')}
          onBlur={() => setInputFocused(null)}
          focused={inputFocused === 'nickname'}
          placeholder="请输入昵称"
          required
          maxLength={20}
        />

        <AuthSelect
          label="学段"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        >
          {Object.entries(GRADE_LEVEL_MAP).map(([value, label]) => (
            <option key={value} value={value} className="bg-slate-900 text-white">
              {label}
            </option>
          ))}
        </AuthSelect>

        <div className="space-y-2">
          <label
            className="text-sm font-light text-white/75 tracking-wide pl-1"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          >
            密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setInputFocused('password')}
              onBlur={() => setInputFocused(null)}
              placeholder="请输入密码（至少6位）"
              required
              minLength={6}
              className={`bubble-input pr-12 ${
                inputFocused === 'password' ? 'bubble-input-focused' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/90 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AuthInput
          label="确认密码"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFocus={() => setInputFocused('confirm')}
          onBlur={() => setInputFocused(null)}
          focused={inputFocused === 'confirm'}
          placeholder="请再次输入密码"
          required
        />

        <AuthSubmitButton loading={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              注册中...
            </>
          ) : (
            '注册'
          )}
        </AuthSubmitButton>
      </form>

      <AuthLink text="已有账号？" linkText="立即登录" to="/login" />
    </AuthShell>
  )
}
