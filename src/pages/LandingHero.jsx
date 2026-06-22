import { useRef, useEffect } from 'react'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Sparkles, ChevronRight, CheckCircle, LogIn, LogOut } from 'lucide-react'
import useExamStore from '../store/examStore'
import { auth, signOut } from '../lib/firebase'
import { entrance, hoverLift, tapScale, ease, springCounter } from '../lib/motion'

const stats = [
  { raw: '50K+', label: 'Exams completed', num: 50 },
  { raw: '99.4%', label: 'Platform uptime', num: 99.4 },
  { raw: '12K+', label: 'Active instructors', num: 12 },
  { raw: '<2s', label: 'Avg. grade time', num: 2 },
]

const headlineWords = ['Assess.', 'Grade.', 'Improve.']

function AnimatedStat({ raw, num }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const springVal = useSpring(0, springCounter)
  const suffix = raw.replace(/[0-9.]/g, '')
  const prefix = raw.startsWith('<') ? '<' : ''
  const isInt = Number.isInteger(num)

  useEffect(() => { if (inView) springVal.set(num) }, [inView, num])

  const display = useTransform(springVal, (v) => {
    const n = isInt ? Math.round(v) : v.toFixed(1)
    return `${prefix}${n}${suffix}`
  })

  return <motion.span ref={ref} className="text-2xl font-mono font-bold text-[#1A1825] dark:text-[#E2E0F0] tabular-nums">{display}</motion.span>
}

export default function LandingHero() {
  const { hasSavedState, setShowAuthModal } = useOutletContext()
  const navigate = useNavigate()
  const { isAuthenticated, allQuestions, startQuiz, useDemoQuestions, restoreState, clearSavedState, clearUser } = useExamStore()

  const handleStartQuiz = () => {
    if (allQuestions.length === 0) {
      useDemoQuestions()
      setTimeout(() => { startQuiz(); navigate('/exam') }, 100)
    } else {
      startQuiz()
      navigate('/exam')
    }
  }

  const handleResume = () => {
    if (restoreState()) {
      navigate('/exam')
    }
  }

  const handleTryDemo = () => {
    useDemoQuestions()
    navigate('/exam')
  }

  return (
    <div>
      <section className="relative pt-16 sm:pt-24 pb-0 px-4 overflow-hidden">
        {/* Violet radial glow — breathing */}
        <motion.div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(91,63,248,0.12) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="max-w-6xl mx-auto">
          <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <motion.div {...entrance()} className="flex-1 min-w-0">
              {/* Eyebrow pill with pulsing dot */}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#EDE9FE] border border-solid border-[#C4B5FD] text-[#5B3FF8] text-xs font-mono font-semibold tracking-widest uppercase mb-8">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#5B3FF8]"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                AI-Powered Assessment Platform
              </span>

              {/* Headline — word by word */}
              <h1 className="text-[clamp(40px,8vw,96px)] font-black leading-[0.92] tracking-[-0.04em] text-[#1A1825] dark:text-[#E2E0F0] mb-6 overflow-visible">
                {headlineWords.map((word, i) => {
                  const isGrade = word === 'Grade.'
                  return (
                    <motion.span
                      key={word}
                      className="inline-block mr-[0.15em] relative"
                      initial={{ y: 16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, ease, delay: i * 0.07 }}
                    >
                      {isGrade ? (
                        <span className="relative">
                          {word.replace('.', '')}
                          <span className="text-[#5B3FF8]">.</span>
                          {/* SVG underline that strokes in */}
                          <svg
                            className="absolute left-0 w-full"
                            style={{ bottom: '-2px', height: '6px' }}
                            viewBox="0 0 200 8"
                            preserveAspectRatio="none"
                          >
                            <motion.path
                              d="M 0 6 Q 25 2, 50 6 T 100 6 T 150 6 T 200 6"
                              stroke="#5B3FF8"
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.6, ease, delay: 0.07 * 2 + 0.15 }}
                            />
                          </svg>
                        </span>
                      ) : (
                        word
                      )}
                      {!isGrade && word === headlineWords[headlineWords.length - 1] ? '' : ' '}
                      {/* line breaks after Assess. and Grade. */}
                      {i < headlineWords.length - 1 && <><br /></>}
                    </motion.span>
                  )
                })}
              </h1>

              <p {...entrance(0.21)} className="text-base sm:text-lg text-[#7A7890] dark:text-[#8A87A0] max-w-md leading-relaxed mb-8">
                The modern exam platform with AI proctoring, instant grading, and actionable analytics. Test knowledge with confidence.
              </p>

              {/* CTAs */}
              <div {...entrance(0.28)} className="flex flex-col sm:flex-row items-start gap-3 mb-4">
                {isAuthenticated ? (
                  <motion.button onClick={handleStartQuiz}
                    whileHover={hoverLift} whileTap={tapScale}
                    className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1A1825] hover:bg-[#2d2b3d] text-[#F7F6F2] font-semibold transition-colors cursor-pointer">
                    Start Quiz <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                ) : (
                  <>
                    <motion.button onClick={() => { useDemoQuestions(); setShowAuthModal(true) }}
                      whileHover={hoverLift} whileTap={tapScale}
                      className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1A1825] hover:bg-[#2d2b3d] text-[#F7F6F2] font-semibold transition-colors cursor-pointer">
                      Get Started <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    <motion.button onClick={handleTryDemo}
                      whileHover={hoverLift} whileTap={tapScale}
                      className="px-6 py-3 rounded-lg bg-white dark:bg-[#131228] border border-solid border-[#C8C6BE] dark:border-[#1E1C32] text-[#1A1825] dark:text-[#E2E0F0] font-medium hover:border-[#1A1825] dark:hover:border-[#E2E0F0] transition-colors cursor-pointer">
                      Try Demo Quiz
                    </motion.button>
                  </>
                )}
                {hasSavedState && (
                  <motion.button onClick={handleResume}
                    whileHover={hoverLift} whileTap={tapScale}
                    className="px-5 py-3 rounded-lg bg-amber-50 border border-solid border-amber-200 text-amber-700 font-medium hover:bg-amber-100 transition-colors cursor-pointer">
                    Resume Quiz
                  </motion.button>
                )}
              </div>

              {!isAuthenticated && (
                <motion.p {...entrance(0.35)} className="text-sm text-[#AEACB8] font-mono">
                  No account needed —{' '}
                  <button onClick={handleTryDemo} className="text-[#5B3FF8] hover:underline cursor-pointer">try the demo</button>
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.3 }}
              className="hidden lg:block flex-shrink-0 w-full max-w-[580px]"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTNNIh0mLN9Xwuvreu7A_yEfKAg3Fj4wwcAC-CsiHU5w&s=10"
                alt="Online learning illustration"
                className="w-full h-auto rounded-2xl shadow-xl object-cover"
                loading="eager"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease }}
        className="max-w-6xl mx-auto px-4 mt-16"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-solid border-[#E4E2DA] dark:border-[#1E1C32] rounded-xl overflow-hidden bg-white dark:bg-[#131228]">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease, delay: i * 0.07 }}
              className={`px-6 py-5 ${i < stats.length - 1 ? 'border-r border-solid border-[#E4E2DA] dark:border-[#1E1C32]' : ''}`}
            >
              <AnimatedStat raw={s.raw} num={s.num} />
              <div className="text-xs text-[#AEACB8] dark:text-[#5A5780] mt-1 tracking-wide">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease }}
            className="bg-[#1A1825] rounded-xl px-8 sm:px-12 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden"
          >
            {/* Diagonal shimmer — one slow sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
              initial={{ backgroundPositionX: '200%' }}
              whileInView={{ backgroundPositionX: '-200%' }}
              viewport={{ once: true }}
              transition={{ duration: 4, ease }}
            />

            <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-[#5B3FF8]/10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F7F6F2] mb-2 tracking-tight">Ready to run your first exam?</h2>
              <p className="text-sm text-[#8A879E] max-w-sm leading-relaxed">
                Join thousands of instructors already on Quizzer. Free account, up in under a minute.
              </p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <motion.button onClick={handleStartQuiz}
                    whileHover={hoverLift} whileTap={tapScale}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#5B3FF8] hover:bg-[#4c33d4] text-white font-semibold transition-colors cursor-pointer">
                    <CheckCircle className="w-4 h-4" /> Start Quiz
                  </motion.button>
                  <motion.button onClick={async () => { await signOut(auth); clearSavedState(); clearUser() }}
                    whileHover={hoverLift} whileTap={tapScale}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/8 border border-solid border-white/10 text-[#C8C6BE] hover:bg-white/12 transition-colors cursor-pointer">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button onClick={() => setShowAuthModal(true)}
                    whileHover={hoverLift} whileTap={tapScale}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#5B3FF8] hover:bg-[#4c33d4] text-white font-semibold transition-colors cursor-pointer">
                    <LogIn className="w-4 h-4" /> Sign In / Register
                  </motion.button>
                  <motion.button onClick={handleTryDemo}
                    whileHover={hoverLift} whileTap={tapScale}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-solid border-white/10 text-[#8A879E] hover:text-[#C8C6BE] hover:border-white/20 transition-colors cursor-pointer">
                    Try demo first
                  </motion.button>
                </>
              )}
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-[#3D3A55] dark:text-[#5A5780] font-mono w-full md:hidden">terms &amp; privacy apply</p>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
