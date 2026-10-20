// Valide les quiz JSON au build : un quiz mal formé fait échouer `npm run build`.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../src/content/quizzes/', import.meta.url).pathname
let errors = []

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const id = file.replace(/\.json$/, '')
  let quiz
  try {
    quiz = JSON.parse(readFileSync(join(dir, file), 'utf8'))
  } catch (e) {
    errors.push(`${file} : JSON invalide (${e.message})`)
    continue
  }
  if (quiz.id !== id) errors.push(`${file} : "id" doit valoir "${id}"`)
  if (typeof quiz.title !== 'string' || !quiz.title) errors.push(`${file} : "title" manquant`)
  if (!Array.isArray(quiz.openQuestions) || !quiz.openQuestions.every((q) => typeof q === 'string')) {
    errors.push(`${file} : "openQuestions" doit être un tableau de chaînes`)
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    errors.push(`${file} : "questions" doit être un tableau non vide`)
    continue
  }
  quiz.questions.forEach((q, i) => {
    const where = `${file} question ${i + 1}`
    if (typeof q.question !== 'string' || !q.question) errors.push(`${where} : "question" manquant`)
    if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push(`${where} : au moins 2 "choices"`)
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer]
    if (!answers.length || !answers.every((a) => Number.isInteger(a) && a >= 0 && a < (q.choices?.length ?? 0))) {
      errors.push(`${where} : "answer" hors des choix`)
    }
    if (typeof q.explanation !== 'string' || !q.explanation) errors.push(`${where} : "explanation" manquant`)
  })
}

if (errors.length) {
  console.error('❌ Quiz invalides :\n- ' + errors.join('\n- '))
  process.exit(1)
}
console.log('✅ Quiz valides')
