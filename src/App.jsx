import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingLayout from './pages/LandingLayout'
import RouteErrorBoundary from './components/RouteErrorBoundary'

const LandingHero = lazy(() => import('./pages/LandingHero'))
const LandingFeatures = lazy(() => import('./pages/LandingFeatures'))
const LandingHowItWorks = lazy(() => import('./pages/LandingHowItWorks'))
const Exam = lazy(() => import('./pages/Exam'))
const Results = lazy(() => import('./pages/Results'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))
const LiveProctoringPage = lazy(() => import('./pages/LiveProctoringPage'))

const Loading = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

function LazyRoute({ Component, errorMsg }) {
  return (
    <RouteErrorBoundary message={errorMsg}>
      <Component />
    </RouteErrorBoundary>
  )
}

const router = createBrowserRouter([
  {
    element: <LandingLayout />,
    children: [
      { index: true, element: <LazyRoute Component={LandingHero} /> },
      { path: '/features', element: <LazyRoute Component={LandingFeatures} errorMsg="Failed to load features page" /> },
      { path: '/how-it-works', element: <LazyRoute Component={LandingHowItWorks} errorMsg="Failed to load how-it-works page" /> },
    ],
  },
  { path: '/exam', element: <LazyRoute Component={Exam} errorMsg="Failed to load exam" /> },
  { path: '/results', element: <LazyRoute Component={Results} errorMsg="Failed to load results" /> },
  { path: '/admin', element: <LazyRoute Component={AdminDashboard} errorMsg="Failed to load admin dashboard" /> },
  { path: '/teacher', element: <LazyRoute Component={TeacherDashboard} errorMsg="Failed to load teacher dashboard" /> },
  { path: '/proctoring', element: <LazyRoute Component={LiveProctoringPage} errorMsg="Failed to load proctoring page" /> },
])

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
