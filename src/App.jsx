import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import useExamStore from './store/examStore'
import Home from './pages/Home'
import Exam from './pages/Exam'
import Results from './pages/Results'
import AdminDashboard from './pages/AdminDashboard'
import LiveProctoringPage from './pages/LiveProctoringPage'

export default function App() {
  const [currentView, setCurrentView] = useState('home')
  const { startQuiz, clearSavedState, resetQuiz, useDemoQuestions } = useExamStore()

  const handleStartQuiz = (questions) => {
    if (questions && questions.length > 0) {
      startQuiz(questions)
    } else {
      const store = useExamStore.getState()
      if (store.allQuestions.length === 0) {
        useDemoQuestions()
        setTimeout(() => useExamStore.getState().startQuiz(), 50)
        setCurrentView('exam')
        return
      }
      startQuiz()
    }
    setCurrentView('exam')
  }

  const handleSubmit = () => {
    setCurrentView('results')
  }

  const handleHome = () => {
    clearSavedState()
    resetQuiz()
    setCurrentView('home')
  }

  const handleNavigate = (view) => {
    setCurrentView(view)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <Home key="home" onStartQuiz={handleStartQuiz} onNavigate={handleNavigate} />
        )}
        {currentView === 'exam' && (
          <Exam key="exam" onSubmit={handleSubmit} />
        )}
        {currentView === 'results' && (
          <Results key="results" onHome={handleHome} />
        )}
        {currentView === 'admin' && (
          <AdminDashboard key="admin" onHome={handleHome} />
        )}
        {currentView === 'proctoring' && (
          <LiveProctoringPage key="proctoring" onBack={() => setCurrentView('admin')} />
        )}
      </AnimatePresence>
    </div>
  )
}
