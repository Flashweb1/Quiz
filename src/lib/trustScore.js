// Trust score: combines multiple behavioral signals into 0-100 integrity metric
// Starting: 100
// Violations deduct; clean behavior recovers over time

const VIOLATION_PENALTIES = {
  TAB_SWITCH: 20,
  FULLSCREEN_EXIT: 25,
  RIGHT_CLICK: 10,
  COPY_PASTE: 15,
  MULTIPLE_FACES: 30,
  FACE_LOST: 15,
  SUSPICIOUS_PATTERN: 20,
}

const RECOVERY_RATE = 5
const RECOVERY_INTERVAL = 60000

export function createTrustScore() {
  let score = 100
  let violations = []
  let intervalId = null
  let lastViolationTime = 0

  function addViolation(type, details = '') {
    const timestamp = Date.now()
    score = Math.max(0, score - (VIOLATION_PENALTIES[type] || 10))
    lastViolationTime = timestamp
    violations.push({ type, timestamp, details, score })
    return { score, type, timestamp }
  }

  function getScore() {
    // Recover points if no recent violations
    const timeSinceLastViolation = Date.now() - lastViolationTime
    if (timeSinceLastViolation > RECOVERY_INTERVAL) {
      const minutesClean = Math.floor(timeSinceLastViolation / RECOVERY_INTERVAL)
      const recovery = Math.min(minutesClean * RECOVERY_RATE, 100 - score)
      score = Math.min(100, score + recovery)
      lastViolationTime = Date.now() - (timeSinceLastViolation % RECOVERY_INTERVAL)
    }
    return Math.round(score)
  }

  function getStatus() {
    const s = getScore()
    if (s >= 80) return 'good'
    if (s >= 50) return 'warning'
    return 'danger'
  }

  function getColor() {
    const s = getScore()
    if (s >= 80) return '#10b981'
    if (s >= 50) return '#f59e0b'
    return '#ef4444'
  }

  function startRecovery() {
    if (intervalId) return
    intervalId = setInterval(() => {
      if (Date.now() - lastViolationTime > RECOVERY_INTERVAL) {
        getScore() // triggers recovery calculation
      }
    }, 10000)
  }

  function stopRecovery() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function reset() {
    score = 100
    violations = []
    lastViolationTime = Date.now()
  }

  function getViolations() { return [...violations] }

  return { addViolation, getScore, getStatus, getColor, startRecovery, stopRecovery, reset, getViolations }
}
