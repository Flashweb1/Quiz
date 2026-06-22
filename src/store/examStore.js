import { create } from 'zustand'
import { createTrustScore } from '../lib/trustScore'
import { demoQuestions } from '../lib/demoQuestions'
import { getFormatDefaults } from '../lib/formatPresets'

const useExamStore = create((set, get) => ({
  // Auth
  user: null,
  userEmail: null,
  userName: null,
  isAuthenticated: false,
  userRole: null,

  // Quiz state
  allQuestions: [],
  currentQuestions: [],
  currentQuestionIndex: 0,
  userAnswers: [],
  flaggedQuestions: [],
  timeRemaining: 0,
  totalTime: 0,
  quizStartTime: null,
  isQuizActive: false,
  quizStatus: 'idle',

  // Exam format
  examFormat: null,
  examConfig: null,

  // Settings
  showReference: true,
  allowHints: true,

  // Anti-cheat
  cheatWarnings: 0,
  trustScore: createTrustScore(),

  // Proctoring
  proctoringActive: false,
  proctoringEvents: [],

  // Admin
  submissions: [],
  questions: [],

  // Question pool
  questionPoolSize: 0,

  // Demo mode
  useDemoData: false,

  // Auth actions
  setUser: (user) => set({
    user,
    userEmail: user?.email || null,
    userName: user?.displayName || user?.email || null,
    isAuthenticated: !!user,
    userRole: user?.role || null,
  }),
  setUserRole: (role) => set({ userRole: role }),
  clearUser: () => set({ user: null, userEmail: null, userName: null, isAuthenticated: false, userRole: null }),

  // Settings
  toggleReference: () => set((s) => ({ showReference: !s.showReference })),
  toggleHints: () => set((s) => ({ allowHints: !s.allowHints })),

  // Quiz actions
  setAllQuestions: (questions) => set({ allQuestions: questions, useDemoData: false }),
  useDemoQuestions: () => set({ allQuestions: demoQuestions, useDemoData: true }),
  setQuestions: (questions) => set({ questions }),

  setExamConfig: (formatId, config) => set({
    examFormat: formatId,
    examConfig: config,
    showReference: config?.referenceEnabled ?? true,
    allowHints: config?.hintsEnabled ?? true,
  }),

  setQuestionPoolSize: (size) => set({ questionPoolSize: size }),

  startQuiz: (questions, config) => {
    const qs = questions || get().allQuestions
    const useConfig = config || get().examConfig || getFormatDefaults('formal-exam')
    const poolSize = get().questionPoolSize
    let pool = useConfig.questionOrder === 'fixed' ? [...qs] : [...qs].sort(() => Math.random() - 0.5)
    if (poolSize > 0 && poolSize < pool.length) {
      pool = pool.slice(0, poolSize)
    }
    const durationSec = (useConfig.duration || 0) * 60
    set({
      examConfig: useConfig,
      currentQuestions: pool,
      currentQuestionIndex: 0,
      userAnswers: [],
      flaggedQuestions: new Array(pool.length).fill(false),
      timeRemaining: durationSec,
      totalTime: durationSec,
      quizStartTime: Date.now(),
      isQuizActive: true,
      quizStatus: 'active',
      cheatWarnings: 0,
      proctoringEvents: [],
      trustScore: createTrustScore(),
      showReference: useConfig.referenceEnabled ?? true,
      allowHints: useConfig.hintsEnabled ?? true,
    })
  },

  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  saveAnswer: (answerObj) => set((s) => {
    const answers = [...s.userAnswers]
    answers[s.currentQuestionIndex] = {
      ...answerObj,
      hintsUsed: answerObj.hintsUsed || 0,
    }
    return { userAnswers: answers }
  }),

  toggleFlag: () => set((s) => {
    const flags = [...s.flaggedQuestions]
    flags[s.currentQuestionIndex] = !flags[s.currentQuestionIndex]
    return { flaggedQuestions: flags }
  }),

  updateTimer: () => set((s) => {
    if (s.timeRemaining <= 0) {
      return { timeRemaining: 0, isQuizActive: false, quizStatus: 'submitted' }
    }
    return { timeRemaining: s.timeRemaining - 1 }
  }),

  submitQuiz: () => set({ isQuizActive: false, quizStatus: 'submitted', timeRemaining: 0 }),

  addCheatWarning: () => set((s) => ({ cheatWarnings: s.cheatWarnings + 1 })),

  addProctoringEvent: (event) => set((s) => ({
    proctoringEvents: [...s.proctoringEvents, event]
  })),

  resetQuiz: () => set({
    currentQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    flaggedQuestions: [],
    timeRemaining: 0,
    totalTime: 0,
    quizStartTime: null,
    isQuizActive: false,
    quizStatus: 'idle',
    examFormat: null,
    examConfig: null,
    questionPoolSize: 0,
    cheatWarnings: 0,
    proctoringEvents: [],
    trustScore: createTrustScore(),
    showReference: true,
    allowHints: true,
  }),

  // Admin
  setSubmissions: (submissions) => set({ submissions }),
  addSubmission: (submission) => set((s) => ({ submissions: [submission, ...s.submissions] })),

  // Save/restore
  saveState: () => {
    const s = get()
    if (!s.isQuizActive) return
    const state = {
      examFormat: s.examFormat,
      examConfig: s.examConfig,
      currentQuestions: s.currentQuestions,
      currentQuestionIndex: s.currentQuestionIndex,
      userAnswers: s.userAnswers,
      flaggedQuestions: s.flaggedQuestions,
      timeRemaining: s.timeRemaining,
      totalTime: s.totalTime,
      quizStartTime: s.quizStartTime,
      quizStatus: s.quizStatus,
      showReference: s.showReference,
      allowHints: s.allowHints,
    }
    localStorage.setItem('quizState', JSON.stringify(state))
  },

  restoreState: () => {
    const saved = localStorage.getItem('quizState')
    if (!saved) return false
    try {
      const state = JSON.parse(saved)
      set({
        ...state,
        isQuizActive: true,
        quizStatus: 'active',
      })
      return true
    } catch {
      return false
    }
  },

  clearSavedState: () => {
    localStorage.removeItem('quizState')
  },
}))

export default useExamStore
