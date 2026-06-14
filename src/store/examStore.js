import { create } from 'zustand'
import { createTrustScore } from '../lib/trustScore'
import { demoQuestions } from '../lib/demoQuestions'

const useExamStore = create((set, get) => ({
  // Auth
  user: null,
  userEmail: null,
  userName: null,
  isAuthenticated: false,

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

  // Demo mode
  useDemoData: false,

  // Auth actions
  setUser: (user) => set({
    user,
    userEmail: user?.email || null,
    userName: user?.displayName || user?.email || null,
    isAuthenticated: !!user,
  }),
  clearUser: () => set({ user: null, userEmail: null, userName: null, isAuthenticated: false }),

  // Settings
  toggleReference: () => set((s) => ({ showReference: !s.showReference })),
  toggleHints: () => set((s) => ({ allowHints: !s.allowHints })),

  // Quiz actions
  setAllQuestions: (questions) => set({ allQuestions: questions, useDemoData: false }),
  useDemoQuestions: () => set({ allQuestions: demoQuestions, useDemoData: true }),
  setQuestions: (questions) => set({ questions }),

  startQuiz: (questions) => {
    const qs = questions || get().allQuestions
    const shuffled = [...qs].sort(() => Math.random() - 0.5)
    set({
      currentQuestions: shuffled,
      currentQuestionIndex: 0,
      userAnswers: [],
      flaggedQuestions: new Array(shuffled.length).fill(false),
      timeRemaining: shuffled.length * 90,
      totalTime: shuffled.length * 90,
      quizStartTime: Date.now(),
      isQuizActive: true,
      quizStatus: 'active',
      cheatWarnings: 0,
      proctoringEvents: [],
      trustScore: createTrustScore(),
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
    cheatWarnings: 0,
    proctoringEvents: [],
    trustScore: createTrustScore(),
  }),

  // Admin
  setSubmissions: (submissions) => set({ submissions }),
  addSubmission: (submission) => set((s) => ({ submissions: [submission, ...s.submissions] })),

  // Save/restore
  saveState: () => {
    const s = get()
    if (!s.isQuizActive) return
    const state = {
      currentQuestions: s.currentQuestions,
      currentQuestionIndex: s.currentQuestionIndex,
      userAnswers: s.userAnswers,
      flaggedQuestions: s.flaggedQuestions,
      timeRemaining: s.timeRemaining,
      totalTime: s.totalTime,
      quizStartTime: s.quizStartTime,
      quizStatus: s.quizStatus,
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
