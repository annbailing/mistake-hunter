import { useState, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import { Loader2, Camera, Save, Lock } from 'lucide-react'
import { GRADE_LEVEL_MAP } from '../types'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [gradeLevel, setGradeLevel] = useState(user?.gradeLevel || 'junior')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pwLoading, setPwLoading] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB')
      return
    }

    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    setUploadingAvatar(true)

    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await authApi.updateProfile(form)
      setUser(res.data.data)
      toast.success('头像上传成功')
    } catch {
      toast.error('头像上传失败')
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) {
      toast.error('请输入昵称')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.updateProfile({
        nickname: nickname.trim(),
        gradeLevel: gradeLevel,
      })
      setUser(res.data.data)
      toast.success('个人信息更新成功')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword) {
      toast.error('请填写原密码和新密码')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }
    if (newPassword.length < 6) {
      toast.error('新密码长度不能少于6位')
      return
    }
    setPwLoading(true)
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })
      toast.success('密码修改成功')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        个人设置
      </h1>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
              {avatarPreview || user?.avatarUrl ? (
                <img
                  src={avatarPreview || user?.avatarUrl}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user?.nickname?.[0] || 'U'
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.nickname}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.phone}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {GRADE_LEVEL_MAP[user?.gradeLevel || 'junior'] || ''}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
              maxLength={20}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              学段
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="input"
            >
              {Object.entries(GRADE_LEVEL_MAP).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary gap-2 w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {loading ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          修改密码
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              原密码
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入原密码"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              新密码
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少6位）"
              minLength={6}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              确认新密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="btn-primary gap-2 w-full"
          >
            {pwLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {pwLoading ? '修改中...' : '修改密码'}
          </button>
        </form>
      </div>
    </div>
  )
}
