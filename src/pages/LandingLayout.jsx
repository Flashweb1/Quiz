import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import useExamStore from '../store/examStore'
import { auth, db, collection, getDocs, doc, getDoc, settingsDocRef, onAuthStateChanged } from '../lib/firebase'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import Footer from '../components/Footer'

export default function LandingLayout() {
  const { setAllQuestions, setUser, clearUser, useDemoQuestions } = useExamStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasSavedState, setHasSavedState] = useState(false)

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        loadQuestions()
      } else {
        clearUser()
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
      await getDoc(settingsDocRef).catch(() => {})
    } catch (e) {
      console.warn("Firebase unavailable, using demo data:", e.message)
      useDemoQuestions()
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#0B0A1A] text-[#1A1825] dark:text-[#E2E0F0]">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#5B3FF8] z-[60]"
        style={{ scaleX, transformOrigin: '0%' }}
      />

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(#E4E2DA 1px, transparent 1px), linear-gradient(90deg, #E4E2DA 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar onSignInClick={() => setShowAuthModal(true)} />
        <main>
          <Outlet context={{ hasSavedState, showAuthModal, setShowAuthModal }} />
        </main>
        <Footer />
      </div>

      <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
