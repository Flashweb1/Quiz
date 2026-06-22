import { motion } from 'framer-motion'
import { ease } from '../lib/motion'

const steps = [
  { num: '01', title: 'Create an Account', desc: 'Sign up as a student or instructor in seconds. No complicated setup required.' },
  { num: '02', title: 'Take the Quiz', desc: 'Full-screen proctored environment with keyboard shortcuts, hints, and real-time trust scoring.' },
  { num: '03', title: 'Review & Improve', desc: 'Get instant results with AI-graded answers, detailed review, and performance analytics.' },
]

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 px-4 border-t border-solid border-[#E4E2DA] dark:border-[#1E1C32]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease }}
          className="mb-8 sm:mb-10"
        >
          <p className="text-xs font-mono font-semibold tracking-[0.14em] uppercase text-[#5B3FF8] mb-2">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1825] dark:text-[#E2E0F0] tracking-tight">Three steps to start</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease, delay: i * 0.12 }}
              className="pt-5 relative"
            >
              {/* Top border that scales in from left */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: i === 0 ? '#5B3FF8' : '#E4E2DA', transformOrigin: 'left' }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.2 }}
              />
              <p className="text-xs font-mono font-semibold text-[#5B3FF8] tracking-widest mb-3">step_{step.num}</p>
              <h3 className="text-base font-semibold text-[#1A1825] dark:text-[#E2E0F0] mb-2">{step.title}</h3>
              <p className="text-sm text-[#7A7890] dark:text-[#8A87A0] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
