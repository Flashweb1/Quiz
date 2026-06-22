import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, UserPlus, X, Mail } from 'lucide-react'
import useExamStore from '../store/examStore'
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from '../lib/firebase'
import { hoverLift, tapScale } from '../lib/motion'

export default function AuthModal({ show, onClose }) {
  const navigate = useNavigate()
  const { useDemoQuestions } = useExamStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('login')
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  if (!show) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      onClose()
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim() || 'Invalid credentials')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!fullname) { setAuthError('Full name required'); return }
    setAuthError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: fullname })
      onClose()
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim() || 'Registration failed')
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email) { setAuthError('Enter your email'); return }
    setAuthError('')
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim() || 'Reset failed')
    }
  }

  const handleSkip = () => {
    useDemoQuestions()
    onClose()
    navigate('/exam')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-sm bg-white dark:bg-[#131228] border border-solid border-[#E4E2DA] dark:border-[#1E1C32] rounded-2xl p-6 shadow-xl dark:shadow-2xl dark:shadow-black/40"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#1A1825] dark:text-[#E2E0F0]">Welcome</h3>
          <motion.button onClick={onClose} whileHover={{ y: -1 }} whileTap={tapScale}
            className="text-[#AEACB8] dark:text-[#5A5780] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] p-1 rounded-lg hover:bg-[#F7F6F2] dark:hover:bg-[#1E1C32] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {resetMode ? (
          <form onSubmit={handleReset} className="space-y-3">
            {resetSent ? (
              <div className="text-center py-4">
                <Mail className="w-10 h-10 mx-auto mb-2 text-[#5B3FF8]" />
                <p className="text-sm text-[#1A1825] dark:text-[#E2E0F0] font-medium">Check your email</p>
                <p className="text-xs text-[#AEACB8] dark:text-[#5A5780] mt-1">Password reset link sent to {email}</p>
                <button type="button" onClick={() => { setResetMode(false); setResetSent(false); setAuthError('') }}
                  className="mt-4 text-sm text-[#5B3FF8] hover:underline cursor-pointer">Back to Sign In</button>
              </div>
            ) : (
              <>
                <input type="email" value={email} required placeholder="Your email"
                  onChange={e => setEmail(e.target.value)}
                  className="auth-input w-full px-4 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#1A1825] border border-solid border-[#E4E2DA] dark:border-[#1E1C32] text-[#1A1825] dark:text-[#E2E0F0] placeholder:text-[#AEACB8] dark:placeholder:text-[#5A5780] text-sm outline-none transition-all" />
                {authError && <p className="text-red-500 text-xs">{authError}</p>}
                <motion.button type="submit" whileHover={hoverLift} whileTap={tapScale}
                  className="w-full py-2.5 rounded-lg bg-[#1A1825] dark:bg-[#E2E0F0] hover:bg-[#2d2b3d] dark:hover:bg-[#C4C0D8] text-[#F7F6F2] dark:text-[#0B0A1A] font-semibold text-sm transition-colors cursor-pointer">
                  <Mail className="w-4 h-4 inline mr-1.5" /> Send Reset Link
                </motion.button>
                <button type="button" onClick={() => { setResetMode(false); setAuthError('') }}
                  className="w-full text-center text-xs text-[#AEACB8] dark:text-[#5A5780] hover:text-[#5B3FF8] mt-2 cursor-pointer">Back to Sign In</button>
              </>
            )}
          </form>
        ) : (
          <>
            {/* Tab switcher with sliding pill */}
            <div className="relative flex bg-[#F7F6F2] dark:bg-[#1A1825] rounded-lg p-1 mb-5">
              <motion.div
                className="absolute top-1 bottom-1 rounded-md bg-white dark:bg-[#131228] border border-solid border-[#E4E2DA] dark:border-[#1E1C32] shadow-sm"
                style={{ width: 'calc(50% - 4px)' }}
                animate={{ x: activeTab === 'register' ? 'calc(100% + 8px)' : '4px' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              {['login', 'register'].map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setAuthError('') }}
                  className="flex-1 py-2 rounded-md text-sm font-medium relative z-10 transition-colors cursor-pointer"
                  style={{ color: activeTab === tab ? (document.documentElement.classList.contains('dark') ? '#E2E0F0' : '#1A1825') : '#AEACB8' }}>
                  {tab === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-3">
              {activeTab === 'register' && (
                <input type="text" value={fullname} required placeholder="Full name"
                  onChange={e => setFullname(e.target.value)}
                  className="auth-input w-full px-4 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#1A1825] border border-solid border-[#E4E2DA] dark:border-[#1E1C32] text-[#1A1825] dark:text-[#E2E0F0] placeholder:text-[#AEACB8] dark:placeholder:text-[#5A5780] text-sm outline-none transition-all" />
              )}
              <input type="email" value={email} required placeholder="Email"
                onChange={e => setEmail(e.target.value)}
                className="auth-input w-full px-4 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#1A1825] border border-solid border-[#E4E2DA] dark:border-[#1E1C32] text-[#1A1825] dark:text-[#E2E0F0] placeholder:text-[#AEACB8] dark:placeholder:text-[#5A5780] text-sm outline-none transition-all" />
              <input type="password" value={password} required placeholder={activeTab === 'login' ? 'Password' : 'Create password'}
                onChange={e => setPassword(e.target.value)}
                className="auth-input w-full px-4 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#1A1825] border border-solid border-[#E4E2DA] dark:border-[#1E1C32] text-[#1A1825] dark:text-[#E2E0F0] placeholder:text-[#AEACB8] dark:placeholder:text-[#5A5780] text-sm outline-none transition-all" />
              {activeTab === 'login' && (
                <button type="button" onClick={() => { setResetMode(true); setAuthError('') }}
                  className="text-xs text-[#AEACB8] dark:text-[#5A5780] hover:text-[#5B3FF8] cursor-pointer">Forgot password?</button>
              )}
              {authError && <p className="text-red-500 text-xs">{authError}</p>}
              <motion.button type="submit"
                whileHover={hoverLift} whileTap={tapScale}
                className="w-full py-2.5 rounded-lg bg-[#1A1825] dark:bg-[#E2E0F0] hover:bg-[#2d2b3d] dark:hover:bg-[#C4C0D8] text-[#F7F6F2] dark:text-[#0B0A1A] font-semibold text-sm transition-colors cursor-pointer">
                {activeTab === 'login'
                  ? <><LogIn className="w-4 h-4 inline mr-1.5" /> Sign In</>
                  : <><UserPlus className="w-4 h-4 inline mr-1.5" /> Create Account</>}
              </motion.button>
            </form>

            <div className="mt-4 text-center">
              <motion.button onClick={handleSkip}
                whileHover={{ y: -1 }}
                className="text-sm text-[#AEACB8] dark:text-[#5A5780] hover:text-[#5B3FF8] transition-colors cursor-pointer">
                Skip — Try Demo Quiz
              </motion.button>
            </div>
          </>
        )}
      </motion.div>

      <style>{`
        .auth-input:focus {
          box-shadow: 0 0 0 3px rgba(91, 63, 248, 0.2);
          border-color: #5B3FF8;
        }
      `}</style>
    </div>
  )
}
