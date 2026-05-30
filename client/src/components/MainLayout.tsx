import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  Calendar,
  Map,
  BarChart3,
  BookOpen,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Search,
  ChevronLeft,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import clsx from 'clsx'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: Home },
  { path: '/mistakes', label: '错题管理', icon: FileText },
  { path: '/review', label: '今日复习', icon: Calendar },
  { path: '/knowledge-map', label: '知识地图', icon: Map },
  { path: '/statistics', label: '学习统计', icon: BarChart3 },
  { path: '/subjects', label: '科目管理', icon: BookOpen },
  { path: '/profile', label: '个人设置', icon: Settings },
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const darkMode = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div
        className={clsx(
          'flex items-center h-16 border-b border-gray-200 dark:border-gray-800',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="brand-logo h-9 w-9">
              <span className="text-white text-sm font-bold">猎</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              错题猎人
            </span>
          </div>
        )}
        {collapsed && (
          <div className="brand-logo h-9 w-9">
            <span className="text-white text-sm font-bold">猎</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft
            className={clsx(
              'h-4 w-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-950/50 dark:to-purple-950/50 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200',
                collapsed && 'justify-center'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <button
          onClick={toggleDarkMode}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {darkMode ? (
            <Sun className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Moon className="h-5 w-5 flex-shrink-0" />
          )}
          {!collapsed && (
            <span>{darkMode ? '浅色模式' : '深色模式'}</span>
          )}
        </button>
        <div
          onClick={() => {
            navigate('/profile')
            setMobileOpen(false)
          }}
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {user?.nickname?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.nickname || '用户'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.phone || ''}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition-all duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索错题..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    navigate(`/mistakes?keyword=${encodeURIComponent((e.target as HTMLInputElement).value)}`)
                  }
                }}
                className="pl-9 pr-4 py-2 w-64 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors sm:hidden"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.nickname?.[0] || 'U'}
                </div>
                <span className="text-sm font-medium hidden md:block text-gray-700 dark:text-gray-300">
                  {user?.nickname}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 z-20 py-1">
                    <NavLink
                      to="/profile"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      个人设置
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
