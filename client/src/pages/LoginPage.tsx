import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import {
  AuthShell,
  AuthTitle,
  AuthInput,
  AuthSubmitButton,
  AuthLink,
} from '../components/auth/AuthShell'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inputFocused, setInputFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !password) {
      toast.error('请填写手机号和密码')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login({ phone, password })
      const { token, refreshToken, user } = res.data.data
      setAuth(token, refreshToken, user)
      toast.success('登录成功')
      navigate('/')
    } catch {
      // 错误已由 api 拦截器统一处理，此处无需重复提示
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell subtitle="让每一道错题都成为进步的阶梯">
      <AuthTitle>欢迎回来</AuthTitle>

      <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="请输入密码"
              required
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

        <AuthSubmitButton loading={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              登录中...
            </>
          ) : (
            '登录'
          )}
        </AuthSubmitButton>
      </form>

      <AuthLink text="还没有账号？" linkText="立即注册" to="/register" />
    </AuthShell>
  )
}
