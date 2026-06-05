import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Flame,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { statsApi, mistakeApi } from '../services/api'
import { SkeletonDashboard } from '../components/ui/Loading'
import type { SummaryData, ErrorTypeData, Mistake } from '../types'
import dayjs from 'dayjs'

const PIE_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#22c55e']

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [errorDist, setErrorDist] = useState<{ name: string; value: number }[]>([])
  const [recentMistakes, setRecentMistakes] = useState<Mistake[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, errorRes, recentRes] = await Promise.allSettled([
          statsApi.getSummary(),
          statsApi.getErrorTypes(),
          mistakeApi.getList({ page: 1, limit: 5 }),
        ])
        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value.data.data)
        }
        if (errorRes.status === 'fulfilled') {
          const data = errorRes.value.data.data
          if (Array.isArray(data)) {
            setErrorDist(
              data.map((d: ErrorTypeData) => ({
                name: d.label || d.errorType,
                value: d.count,
              }))
            )
          }
        }
        if (recentRes.status === 'fulfilled') {
          setRecentMistakes(recentRes.value.data.data?.list || [])
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <SkeletonDashboard />

  const statCards = [
    {
      label: '今日新增',
      value: summary?.todayNew ?? 0,
      icon: TrendingUp,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: '待复习',
      value: summary?.pendingReview ?? 0,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: '已掌握',
      value: summary?.mastered ?? 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: '连续学习',
      value: `${summary?.streak ?? 0}天`,
      icon: Flame,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ]

  const today = dayjs()
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    today.startOf('week').add(i, 'day')
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">
          仪表盘
        </h1>
        <Link
          to="/mistakes/new"
          className="btn-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          新建错题
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card p-5 flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white shadow-lg`}
            >
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            错因分布
          </h2>
          {errorDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={errorDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={PIE_COLORS[errorDist.findIndex((d: any) => d.name === name) % PIE_COLORS.length]}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={500}
                      >
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {errorDist.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无数据</p>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              最近错题
            </h2>
            <Link
              to="/mistakes"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 transition-colors"
            >
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentMistakes.length > 0 ? (
            <div className="space-y-2">
              {recentMistakes.map((m) => (
                <Link
                  key={m.id}
                  to={`/mistakes/${m.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg flex-shrink-0">
                      {m.subject?.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {m.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {m.subject?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-3">
                    {dayjs(m.createdAt).format('MM-DD')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[220px] text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">-</p>
              <p className="text-sm mb-3">还没有录入错题</p>
              <Link
                to="/mistakes/new"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                录入第一道错题
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          本周学习日历
        </h2>
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const isToday = day.isSame(today, 'day')
            return (
              <div
                key={day.format('YYYY-MM-DD')}
                className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
                  isToday
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {day.format('ddd')}
                </span>
                <span
                  className={`text-lg font-semibold ${
                    isToday
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {day.format('DD')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
