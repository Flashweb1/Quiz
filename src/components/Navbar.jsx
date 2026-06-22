import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, LogIn, LogOut, Menu, X, Moon, Sun } from 'lucide-react'
import useExamStore from '../store/examStore'
import { auth, signOut } from '../lib/firebase'
import { useTheme } from '../lib/ThemeContext'

export default function Navbar({ onSignInClick }) {
  const { isAuthenticated, userEmail, userName, clearSavedState, clearUser } = useExamStore()
  const { dark, toggle } = useTheme()
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    await signOut(auth)
    clearSavedState()
    clearUser()
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-[#F7F6F2]/90 dark:bg-[#0B0A1A]/90 backdrop-blur-xl border-b border-solid border-[#E4E2DA] dark:border-[#1E1C32]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1A1825] dark:bg-[#E2E0F0] flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F7F6F2] dark:text-[#0B0A1A]" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-widest uppercase text-[#1A1825] dark:text-[#E2E0F0]">
              Quiz<span className="text-[#5B3FF8]">zer</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/features" className={`text-sm transition-colors cursor-pointer ${isActive('/features') ? 'text-[#1A1825] dark:text-[#E2E0F0] font-semibold' : 'text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0]'}`}>Features</Link>
            <Link to="/how-it-works" className={`text-sm transition-colors cursor-pointer ${isActive('/how-it-works') ? 'text-[#1A1825] dark:text-[#E2E0F0] font-semibold' : 'text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0]'}`}>How It Works</Link>
            <button onClick={toggle} className="p-2 rounded-lg text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] hover:bg-[#E4E2DA] dark:hover:bg-[#1A1825]/30 transition-all cursor-pointer" title={dark ? 'Light mode' : 'Dark mode'}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#7A7890] dark:text-[#8A87A0]">{userName || userEmail}</span>
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <button onClick={onSignInClick} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A1825] dark:bg-[#E2E0F0] hover:bg-[#2d2b3d] dark:hover:bg-[#C4C0D8] text-[#F7F6F2] dark:text-[#0B0A1A] text-sm font-semibold transition-all cursor-pointer">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] cursor-pointer p-1">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="md:hidden bg-[#F7F6F2] dark:bg-[#0B0A1A] border-b border-solid border-[#E4E2DA] dark:border-[#1E1C32] px-4 py-3 space-y-2">
          <button onClick={toggle} className="flex items-center gap-2 text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] py-2 cursor-pointer">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <Link to="/features" onClick={() => setMobileMenu(false)} className="block text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] py-2 cursor-pointer">Features</Link>
          <Link to="/how-it-works" onClick={() => setMobileMenu(false)} className="block text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] py-2 cursor-pointer">How It Works</Link>
          {isAuthenticated ? (
            <>
              <p className="text-xs text-[#AEACB8] dark:text-[#5A5780]">Signed in as {userName || userEmail}</p>
              <button onClick={handleLogout} className="w-full text-left text-sm text-red-500 py-2 cursor-pointer">Sign Out</button>
            </>
          ) : (
            <button onClick={() => { onSignInClick(); setMobileMenu(false) }} className="w-full text-left text-sm text-[#5B3FF8] py-2 font-semibold cursor-pointer">Sign In</button>
          )}
        </div>
      )}
    </nav>
  )
}
