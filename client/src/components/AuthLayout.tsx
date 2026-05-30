import { Outlet } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';

export default function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <span className="text-white text-xl font-bold">猎</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">错题猎人</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">让每一道错题都成为进步的阶梯</p>
      </div>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}