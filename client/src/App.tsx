import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import MainLayout from './components/MainLayout'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/ui/Loading'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MistakeListPage = lazy(() => import('./pages/MistakeListPage'))
const MistakeCreatePage = lazy(() => import('./pages/MistakeCreatePage'))
const MistakeDetailPage = lazy(() => import('./pages/MistakeDetailPage'))
const MistakeEditPage = lazy(() => import('./pages/MistakeEditPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const KnowledgeMapPage = lazy(() => import('./pages/KnowledgeMapPage'))
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'))
const SubjectManagePage = lazy(() => import('./pages/SubjectManagePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<ErrorBoundary><SuspenseWrapper><LoginPage /></SuspenseWrapper></ErrorBoundary>} />
      <Route path="/register" element={<ErrorBoundary><SuspenseWrapper><RegisterPage /></SuspenseWrapper></ErrorBoundary>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ErrorBoundary>
                <SuspenseWrapper>
                  <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/mistakes" element={<MistakeListPage />} />
                  <Route path="/mistakes/new" element={<MistakeCreatePage />} />
                  <Route path="/mistakes/:id" element={<MistakeDetailPage />} />
                  <Route path="/mistakes/:id/edit" element={<MistakeEditPage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/knowledge-map" element={<KnowledgeMapPage />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                  <Route path="/subjects" element={<SubjectManagePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </SuspenseWrapper>
              </ErrorBoundary>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
