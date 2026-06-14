// Lightweight semantic similarity using compromise NLP

let nlp

async function getNlp() {
  if (!nlp) {
    nlp = (await import('compromise')).default
  }
  return nlp
}

function normalize(text) {
  return text.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function tokenize(text) {
  return text.split(/\s+/).filter(t => t.length > 0)
}

export async function computeSimilarity(studentAnswer, correctAnswer) {
  const studentNorm = normalize(studentAnswer || '')
  const correctNorm = normalize(correctAnswer || '')

  if (!studentNorm || !correctNorm) return 0

  // Exact match = 100%
  if (studentNorm === correctNorm) return 100

  // Token overlap
  let studentTokens
  let correctTokens

  try {
    const n = await getNlp()
    studentTokens = n(studentNorm).terms().out('array')
    correctTokens = n(correctNorm).terms().out('array')
  } catch {
    studentTokens = tokenize(studentNorm)
    correctTokens = tokenize(correctNorm)
  }

  if (correctTokens.length === 0) return 0

  const intersection = studentTokens.filter(t => correctTokens.includes(t))
  const union = new Set([...studentTokens, ...correctTokens])

  // Jaccard similarity weighted for short answers
  const jaccard = intersection.length / union.size
  const overlap = intersection.length / correctTokens.length

  // Bonus for exact phrase containment
  const containmentBonus = correctNorm.includes(studentNorm) || studentNorm.includes(correctNorm) ? 15 : 0

  const score = Math.min(100, Math.round(((jaccard * 0.5 + overlap * 0.5) * 85) + containmentBonus))
  return score
}

export function computeSimilaritySync(studentAnswer, correctAnswer) {
  const studentNorm = normalize(studentAnswer || '')
  const correctNorm = normalize(correctAnswer || '')

  if (!studentNorm || !correctNorm) return 0
  if (studentNorm === correctNorm) return 100

  const studentTokens = tokenize(studentNorm)
  const correctTokens = tokenize(correctNorm)
  if (correctTokens.length === 0) return 0

  const intersection = studentTokens.filter(t => correctTokens.includes(t))
  const union = new Set([...studentTokens, ...correctTokens])

  const jaccard = intersection.length / union.size
  const overlap = intersection.length / correctTokens.length
  const containmentBonus = correctNorm.includes(studentNorm) || studentNorm.includes(correctNorm) ? 15 : 0

  return Math.min(100, Math.round(((jaccard * 0.5 + overlap * 0.5) * 85) + containmentBonus))
}
