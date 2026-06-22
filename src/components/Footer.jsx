import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-solid border-[#E4E2DA] dark:border-[#1E1C32] bg-white dark:bg-[#0B0A1A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#1A1825] dark:bg-[#E2E0F0] flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-[#F7F6F2] dark:text-[#0B0A1A]" />
              </div>
              <span className="text-base font-extrabold tracking-widest uppercase text-[#1A1825] dark:text-[#E2E0F0]">
                Quiz<span className="text-[#5B3FF8]">zer</span>
              </span>
            </Link>
            <p className="text-sm text-[#7A7890] dark:text-[#8A87A0] leading-relaxed max-w-xs">
              The modern exam platform with AI proctoring, instant grading, and actionable analytics.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#AEACB8] dark:text-[#5A5780] mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link to="/features" className="text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] transition-colors">Features</Link></li>
              <li><Link to="/how-it-works" className="text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] transition-colors">How It Works</Link></li>
              <li><Link to="/" className="text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#AEACB8] dark:text-[#5A5780] mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link to="/admin" className="text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] transition-colors">Admin Dashboard</Link></li>
              <li><a href="#" className="text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-[#7A7890] dark:text-[#8A87A0] hover:text-[#1A1825] dark:hover:text-[#E2E0F0] transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-solid border-[#E4E2DA] dark:border-[#1E1C32] py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#AEACB8] dark:text-[#5A5780]">Built with React, Tailwind, and Firebase. &copy; {new Date().getFullYear()}</p>
          <p className="text-xs text-[#AEACB8] dark:text-[#5A5780]">Quizzer — AI-Powered Assessment</p>
        </div>
      </div>
    </footer>
  )
}
