import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { statsApi, subjectApi } from '../services/api'
import type { Subject } from '../types'
import { Skeleton } from '../components/ui/Loading'
import { BarChart3 } from 'lucide-react'

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#22c55e', '#ec4899']
const PERIODS = [
  { value: 'week', label: '近一周' },
  { value: 'month', label: '近一月' },
  { value: 'all', label: '全部' },
]

export default function StatisticsPage() {
  const [trend, setTrend] = useState<any[]>([])
  const [errorTypes, setErrorTypes] = useState<any[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')
  const [subjectFilter, setSubjectFilter] = useState('')

  useEffect(() => {
    subjectApi
      .getAll()
      .then((r) => setSubjects(r.data.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: { period?: string; subject_id?: string } = { period }
    if (subjectFilter) params.subject_id = subjectFilter

    Promise.all([
      statsApi.getTrend(params).then((r) => setTrend(r.data.data || [])),
      statsApi
        .getErrorTypes(subjectFilter ? { subject_id: subjectFilter } : undefined)
        .then((r) => {
          const data = r.data.data || []
          setErrorTypes(
            Array.isArray(data)
              ? data.map((d: any) => ({
                  name: d.label || d.error_type,
                  value: d.count,
                }))
              : []
          )
        }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period, subjectFilter])

  const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    fontSize: '12px',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          学习统计
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
          >
            <option value="">全部科目</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {trend.length === 0 && errorTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            暂无统计数据，请先录入一些错题
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              错题趋势
            </h2>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    name="新增错题"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mastered"
                    stroke="#22c55e"
                    name="已掌握"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500">
                暂无数据
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              错因分布
            </h2>
            {errorTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={errorTypes}
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
                          fill={COLORS[errorTypes.findIndex((d: any) => d.name === name) % COLORS.length]}
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
                    {errorTypes.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-gray-400 dark:text-gray-500">
                暂无数据
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              掌握率变化
            </h2>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`${value}%`, '掌握率']}
                  />
                  <Area
                    type="monotone"
                    dataKey="masteryRate"
                    stroke="#22c55e"
                    fill="#22c55e33"
                    name="掌握率"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500">
                暂无数据
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              科目对比
            </h2>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill="#3b82f6"
                    name="新增错题"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
