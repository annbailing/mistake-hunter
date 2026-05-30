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
          'flex items-center h-16 border-b border-white/40 dark:border-white/6',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {!collapsed && (
          <span className="text-base font-light tracking-[0.12em] text-slate-800 dark:text-slate-100">
            错题猎人
          </span>
        )}
        {collapsed && (
          <span className="text-sm font-light text-indigo-500 dark:text-indigo-400">猎</span>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/50 dark:hover:text-slate-300 dark:hover:bg-white/6 transition-colors"
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
                'app-nav-item',
                isActive && 'app-nav-item-active',
                collapsed && 'justify-center'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/40 dark:border-white/6 space-y-1">
        <button
          onClick={toggleDarkMode}
          className={clsx(
            'app-nav-item w-full',
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
            'app-nav-item cursor-pointer',
            collapsed && 'justify-center'
          )}
        >
          <div className="avatar-bubble h-8 w-8">
            {user?.nickname?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {user?.nickname || '用户'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.phone || ''}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={clsx(
            'app-nav-item w-full text-danger-600 dark:text-danger-400 hover:!text-danger-700',
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
    <div className="app-shell">
      <div className="app-bg-image" />
      <div className="app-bg-mist" />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'app-sidebar fixed inset-y-0 left-0 z-50 transition-all duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/50 dark:hover:bg-white/6"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <header className="app-header h-16 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-full text-slate-500 hover:bg-white/50 dark:hover:bg-white/6 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索错题..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    navigate(`/mistakes?keyword=${encodeURIComponent((e.target as HTMLInputElement).value)}`)
                  }
                }}
                className="input pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-500 hover:bg-white/50 dark:hover:bg-white/6 transition-colors sm:hidden"
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
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/6 transition-colors"
              >
                <div className="avatar-bubble w-8 h-8">
                  {user?.nickname?.[0] || 'U'}
                </div>
                <span className="text-sm font-normal hidden md:block text-slate-700 dark:text-slate-300">
                  {user?.nickname}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 card py-1 z-20 !rounded-2xl">
                    <NavLink
                      to="/profile"
                      className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/6 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      个人设置
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-white/60 dark:hover:bg-white/6 transition-colors"
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
