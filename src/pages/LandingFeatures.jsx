import { motion } from 'framer-motion'
import { Shield, Brain, BarChart3, Zap } from 'lucide-react'
import { entrance, hoverLift, ease } from '../lib/motion'

const features = [
  { icon: Shield, title: 'AI-Powered Proctoring', desc: 'Real-time face detection, tab switch monitoring, and trust scoring to ensure exam integrity.' },
  { icon: Brain, title: 'Smart Auto-Grading', desc: 'AI-assisted grading with semantic similarity analysis. Objective questions graded instantly.' },
  { icon: BarChart3, title: 'Advanced Analytics', desc: 'Detailed performance reports, question analytics, and cohort comparisons for instructors.' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Immediate results with detailed answer review, similarity scores, and performance insights.' },
]

export default function LandingFeatures() {
  return (
    <section id="features" className="py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease }}
          className="mb-8 sm:mb-10"
        >
          <p className="text-xs font-mono font-semibold tracking-[0.14em] uppercase text-[#5B3FF8] mb-2">Features</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1825] dark:text-[#E2E0F0] tracking-tight">Everything you need</h2>
          <p className="mt-2 text-sm sm:text-base text-[#7A7890] dark:text-[#8A87A0]">A complete toolkit — secure proctoring to instant, AI-graded results.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#E4E2DA] dark:bg-[#1E1C32] border border-solid border-[#E4E2DA] dark:border-[#1E1C32] rounded-xl overflow-hidden"
        >
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease, delay: i * 0.07 }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(91,63,248,0.10)', transition: { duration: 0.2, ease } }}
              className="group relative bg-white dark:bg-[#131228] hover:bg-[#FDFCFA] dark:hover:bg-[#1A1825] transition-colors p-6 sm:p-7"
            >
              {/* Left border that grows on hover */}
              <span className="feature-left-border" />

              <span className="feature-chip inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[#5B3FF8] text-xs font-mono font-semibold tracking-wider mb-4 border border-solid border-[#C4B5FD]">
                <feat.icon className="w-3.5 h-3.5" />
                {feat.title.split(' ')[0].toLowerCase()}
              </span>
              <h3 className="text-base font-semibold text-[#1A1825] dark:text-[#E2E0F0] mb-2">{feat.title}</h3>
              <p className="text-sm text-[#7A7890] dark:text-[#8A87A0] leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        .feature-chip {
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .feature-chip::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #5B3FF8;
          z-index: -1;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .group:hover .feature-chip::before {
          transform: scaleX(1);
        }
        .group:hover .feature-chip {
          color: #F7F6F2;
          border-color: #5B3FF8;
        }
        .feature-left-border {
          position: absolute;
          left: 0;
          top: 0;
          width: 2px;
          height: 0;
          background: #5B3FF8;
          transition: height 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .group:hover .feature-left-border {
          height: 100%;
        }
      `}</style>
    </section>
  )
}
