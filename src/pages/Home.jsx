import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Shield, BarChart3, Brain, ChevronRight, LogIn, UserPlus, LogOut, Sparkles, CheckCircle, ArrowRight, Menu, X, Zap } from 'lucide-react'
import useExamStore from '../store/examStore'
import { db, auth, collection, getDocs, doc, getDoc, settingsDocRef, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from '../lib/firebase'

const features = [
  { icon: Shield, title: 'AI-Powered Proctoring', desc: 'Real-time face detection, tab switch monitoring, and trust scoring to ensure exam integrity.' },
  { icon: Brain, title: 'Smart Auto-Grading', desc: 'AI-assisted grading with semantic similarity analysis. Objective questions graded instantly.' },
  { icon: BarChart3, title: 'Advanced Analytics', desc: 'Detailed performance reports, question analytics, and cohort comparisons for instructors.' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Immediate results with detailed answer review, similarity scores, and performance insights.' },
]

const steps = [
  { num: '01', title: 'Create an Account', desc: 'Sign up as a student or instructor in seconds. No complicated setup required.' },
  { num: '02', title: 'Take the Quiz', desc: 'Full-screen proctored environment with keyboard shortcuts, hints, and real-time trust scoring.' },
  { num: '03', title: 'Review & Improve', desc: 'Get instant results with AI-graded answers, detailed review, and performance analytics.' },
]

export default function Home({ onStartQuiz, onNavigate }) {
  const {
    allQuestions, setAllQuestions, isAuthenticated, userEmail, userName,
    showReference, allowHints, toggleReference, toggleHints,
    restoreState, setUser, clearUser, clearSavedState, useDemoQuestions, useDemoData,
  } = useExamStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [authError, setAuthError] = useState('')
  const [quizAvailable, setQuizAvailable] = useState(false)
  const [hasSavedState, setHasSavedState] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        window.currentUserEmail = user.email
        window.currentUserName = user.displayName || user.email
        loadQuestions()
      } else {
        clearUser()
        setTimeout(() => setLoading(false), 500)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    setHasSavedState(!!localStorage.getItem('quizState'))
  }, [])

  async function loadQuestions() {
    try {
      const qSnap = await getDocs(collection(db, "questions"))
      const loaded = []
      qSnap.forEach((docSnap) => loaded.push({ id: docSnap.id, ...docSnap.data() }))
      if (loaded.length > 0) {
        setAllQuestions(loaded)
      } else {
        useDemoQuestions()
      }
      checkQuizAvailability()
    } catch (e) {
      console.warn("Firebase unavailable, using demo data:", e.message)
      useDemoQuestions()
      setQuizAvailable(true)
      setTimeout(() => setLoading(false), 500)
    }
  }

  async function checkQuizAvailability() {
    try {
      const docSnap = await getDoc(settingsDocRef)
      setQuizAvailable(docSnap.exists() && docSnap.data().isQuizActive)
    } catch {
      setQuizAvailable(true)
    }
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setShowAuthModal(false)
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim() || 'Invalid credentials')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!fullname) { setAuthError('Full name required'); return }
    setAuthError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: fullname })
      setShowAuthModal(false)
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim() || 'Registration failed')
    }
  }

  async function handleLogout() {
    await signOut(auth)
    clearSavedState()
    clearUser()
  }

  function handleStartQuiz() {
    if (allQuestions.length === 0) {
      useDemoQuestions()
      setTimeout(() => onStartQuiz(), 100)
    } else {
      onStartQuiz()
    }
  }

  function handleResume() {
    if (restoreState()) {
      onStartQuiz()
    }
  }

  function scrollTo(section) {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenu(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Fixed background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-glow" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-violet-500/12 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Quizzer</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo('features')} className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">Features</button>
              <button onClick={() => scrollTo('how-it-works')} className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">How It Works</button>
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{userName || userEmail}</span>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer">
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
              )}
            </div>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-slate-400 hover:text-slate-200 cursor-pointer">
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 px-4 py-4 space-y-3">
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-sm text-slate-400 hover:text-slate-200 py-2 cursor-pointer">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left text-sm text-slate-400 hover:text-slate-200 py-2 cursor-pointer">How It Works</button>
            {isAuthenticated ? (
              <>
                <p className="text-sm text-slate-500">Signed in as {userName || userEmail}</p>
                <button onClick={handleLogout} className="w-full text-left text-sm text-red-400 py-2 cursor-pointer">Sign Out</button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setMobileMenu(false) }} className="w-full text-left text-sm text-indigo-400 py-2 font-semibold cursor-pointer">Sign In</button>
            )}
          </div>
        )}
      </nav>

      {/* Loading skeleton */}
      {loading && (
        <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
          <div className="max-w-5xl mx-auto text-center animate-pulse">
            <div className="mx-auto w-48 h-5 rounded-full bg-slate-800 mb-6" />
            <div className="mx-auto w-64 sm:w-96 h-14 rounded-xl bg-slate-800 mb-4" />
            <div className="mx-auto max-w-md h-5 rounded bg-slate-800/80 mb-2" />
            <div className="mx-auto max-w-xs h-5 rounded bg-slate-800/60 mb-8" />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-48 h-14 rounded-xl bg-slate-800" />
              <div className="w-40 h-14 rounded-xl bg-slate-800/60" />
            </div>
          </div>
        </section>
      )}

      {/* ============ HERO ============ */}
      {!loading && (
      <section className="relative pt-24 pb-16 sm:pt-40 sm:pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-semibold mb-8">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Assessment Platform
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                Quizzer
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
              The modern exam platform with AI proctoring, instant grading, and actionable analytics.
              Test knowledge with confidence.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                  <button onClick={handleStartQuiz}
                    className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-[0.98]">
                    Start Quiz <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <>
                    <button onClick={() => { useDemoQuestions(); setShowAuthModal(true) }}
                      className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-[0.98]">
                      Get Started <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => { useDemoQuestions(); setShowAuthModal(false); onStartQuiz() }}
                      className="px-8 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 font-medium hover:bg-slate-700/50 transition-all cursor-pointer active:scale-[0.98]">
                      Try Demo Quiz
                    </button>
                  </>
                )}
                {hasSavedState && (
                  <button onClick={handleResume}
                    className="px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium hover:bg-amber-500/20 transition-all cursor-pointer active:scale-[0.98]">
                    Resume Quiz
                  </button>
                )}
            </div>
            {!isAuthenticated && (
              <p className="mt-4 text-sm text-slate-500">
                No account needed —{' '}
                <button onClick={() => { useDemoQuestions(); onStartQuiz() }} className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer">
                  try the demo
                </button>
              </p>
            )}
          </motion.div>
        </div>
      </section>
      )}

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold">Built for Modern Assessments</h2>
            <p className="mt-2 text-sm sm:text-lg text-slate-400">Everything you need to create, manage, and analyze exams.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {features.map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/50 ring-1 ring-slate-800/30 hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all duration-300 active:scale-[0.99]">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  <feat.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold">How It Works</h2>
            <p className="mt-2 text-sm sm:text-lg text-slate-400">Three simple steps to get started.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-8 -right-4 text-slate-700 text-2xl">→</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA + AUTH ============ */}
      <section id="cta" className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-violet-500/10 border border-indigo-500/20 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3">Ready to Get Started?</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6 sm:mb-8 max-w-md mx-auto">Sign in or create an account to start taking quizzes and tracking your progress.</p>

            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={handleStartQuiz}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg transition-all cursor-pointer active:scale-[0.98]">
                  <CheckCircle className="w-4 h-4" /> Start Quiz
                </button>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 transition-all cursor-pointer active:scale-[0.98]">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg transition-all mx-auto cursor-pointer active:scale-[0.98]">
                <LogIn className="w-4 h-4" /> Sign In / Register
              </button>
            )}

            {!isAuthenticated && (
              <p className="mt-4 text-xs text-slate-600">
                By signing in, you agree to our terms and privacy policy.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-6 sm:py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-400">Quizzer</span>
          </div>
          <p className="text-xs text-slate-600">Built with React, Tailwind, and Firebase. &copy; {new Date().getFullYear()}</p>
          <button onClick={() => onNavigate && onNavigate('admin')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
            Admin Dashboard
          </button>
        </div>
      </footer>

      {/* ============ AUTH MODAL ============ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-100">Welcome</h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-slate-800/50 rounded-xl p-1 mb-5">
              {['login','register'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500'}`}>
                  {tab === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-3">
              {activeTab === 'register' && (
                <input type="text" value={fullname} required placeholder="Full name"
                  onChange={e => setFullname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
              )}
              <input type="email" value={email} required placeholder="Email"
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
              <input type="password" value={password} required placeholder={activeTab === 'login' ? 'Password' : 'Create password'}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all cursor-pointer">
                {activeTab === 'login' ? <><LogIn className="w-4 h-4 inline mr-1.5" /> Sign In</> : <><UserPlus className="w-4 h-4 inline mr-1.5" /> Create Account</>}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => { useDemoQuestions(); setShowAuthModal(false); onStartQuiz() }}
                className="text-sm text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer">
                Skip — Try Demo Quiz
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
