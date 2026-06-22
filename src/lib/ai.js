const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function callGemini(prompt) {
  if (!GEMINI_KEY) throw new Error('Gemini API key not configured')
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Gemini error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return text
}

async function callOpenRouter(prompt, model = 'openai/gpt-4o-mini') {
  if (!OPENROUTER_KEY) throw new Error('OpenRouter API key not configured')
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenRouter returned empty response')
  return text
}

async function callAI(prompt) {
  const errors = []
  try {
    return await callGemini(prompt)
  } catch (e) {
    errors.push(`Gemini: ${e.message}`)
  }
  try {
    return await callOpenRouter(prompt)
  } catch (e) {
    errors.push(`OpenRouter: ${e.message}`)
  }
  throw new Error(`AI unavailable: ${errors.join('; ')}`)
}

function extractJSON(text) {
  const jsonMatch = text.match(/\[[\s\S]*?\]/) || text.match(/\{[\s\S]*?\}/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) } catch {}
  }
  try { return JSON.parse(text) } catch {}
  return null
}

export async function generateQuestions({ topic, count = 10, type = 'mixed', category = 'General' }) {
  const types = type === 'mixed'
    ? 'multiple-choice and short-answer'
    : type === 'multiple-choice' ? 'multiple-choice' : 'short-answer'

  const prompt = `You are a quiz generator for educators. Generate exactly ${count} ${types} questions about "${topic}".

Return ONLY valid JSON array — no explanations, no markdown formatting, no code fences.

Each object must follow this schema:
${type === 'short-answer' ? `{ "type": "short-answer", "category": "${category}", "question": "...", "answer": "single correct answer" }` : type === 'multiple-choice' ? `{ "type": "multiple-choice", "category": "${category}", "question": "...", "options": ["A", "B", "C", "D"], "answer": "exact text of correct option" }` : `{ "type": "multiple-choice"|"short-answer", "category": "${category}", "question": "...", ${type === 'mixed' ? '"options": ["A","B","C","D"], "answer": "..."' : ''} }`}

Rules:
- Questions must be factually accurate and grade-appropriate
- Multiple-choice must have exactly 4 options
- For short-answer, the answer should be concise (1-5 words)
- Include a "reference" field with a brief source hint when possible`

  const raw = await callAI(prompt)
  let questions = extractJSON(raw)
  if (!Array.isArray(questions)) {
    const retry = await callOpenRouter(`Extract the JSON array from this text and return ONLY the JSON array:\n\n${raw}`)
    questions = extractJSON(retry)
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Failed to parse generated questions. Please try again.')
  }
  return questions.map((q, i) => ({
    type: q.type || type,
    category: q.category || category,
    question: q.question || `Question ${i + 1}`,
    options: q.options || [],
    answer: q.answer || '',
    reference: q.reference || '',
  }))
}

export async function aiGradeAnswer(question, correctAnswer, studentAnswer) {
  if (!studentAnswer?.trim() || !correctAnswer?.trim()) {
    return { score: 0, feedback: 'No answer provided', confidence: 1 }
  }
  if (studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
    return { score: 100, feedback: 'Exact match', confidence: 1 }
  }

  const prompt = `You are a grading assistant. Evaluate the student's answer against the correct answer.

Question: "${question}"
Correct answer: "${correctAnswer}"
Student answer: "${studentAnswer}"

Return ONLY a JSON object (no markdown, no extra text):
{ "score": number 0-100, "feedback": "brief 1-sentence explanation", "confidence": number 0-1 }

Rules:
- Score 100 only if semantically equivalent to correct answer
- Score 70+ for partially correct but shows understanding
- Score 30-69 for vaguely related but missing key concept
- Score 0-29 for completely wrong or off-topic
- Be generous with synonyms and paraphrasing
- Confidence reflects how sure you are about the score`

  const raw = await callAI(prompt)
  const result = extractJSON(raw)
  if (result && typeof result.score === 'number') {
    return {
      score: Math.max(0, Math.min(100, result.score)),
      feedback: result.feedback || '',
      confidence: result.confidence || 0.5,
    }
  }
  return { score: 50, feedback: 'Grading unavailable — marked for review', confidence: 0 }
}

export async function generateExplanation(question, correctAnswer, studentAnswer, isCorrect) {
  const prompt = `You are a tutor. Explain this question briefly.

Question: "${question}"
Correct answer: "${correctAnswer}"
${studentAnswer ? `Student answered: "${studentAnswer}" (${isCorrect ? 'correct' : 'incorrect'})` : 'Student did not answer'}

Give a concise 2-3 sentence explanation. Return ONLY the explanation text, no JSON.`

  return await callAI(prompt)
}
