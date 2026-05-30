export const ERROR_TYPES: Record<string, string> = {
  concept: '概念混淆',
  compute: '计算失误',
  read: '审题不清',
  forget: '知识点遗忘',
  method: '解题方法错误',
};

export const MASTERY_STATUS: Record<string, string> = {
  unmastered: '未掌握',
  reviewing: '复习中',
  mastered: '已掌握',
};

export const GRADE_LEVELS: Record<string, string> = {
  elementary: '小学',
  junior: '初中',
  senior: '高中',
  university: '大学',
};

export const ERROR_TYPE_COLORS: Record<string, string> = {
  concept: '#8b5cf6',
  compute: '#f59e0b',
  read: '#3b82f6',
  forget: '#ef4444',
  method: '#10b981',
};

export const NAV_ITEMS = [
  { path: '/dashboard', label: '首页', icon: 'Home' },
  { path: '/mistakes', label: '错题管理', icon: 'FileText' },
  { path: '/review', label: '今日复习', icon: 'Calendar' },
  { path: '/knowledge-map', label: '知识地图', icon: 'Map' },
  { path: '/statistics', label: '学习统计', icon: 'BarChart3' },
  { path: '/subjects', label: '科目管理', icon: 'BookOpen' },
  { path: '/profile', label: '个人设置', icon: 'Settings' },
];