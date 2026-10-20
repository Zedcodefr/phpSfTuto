export type QuizQuestion = {
  question: string
  choices: string[]
  /** Index de la bonne réponse, ou tableau d'index si plusieurs réponses sont attendues */
  answer: number | number[]
  explanation: string
  code?: string
  /** Langage du code pour la coloration (déduit si absent : php si le code contient "$" ou "<?php", sinon tsx) */
  language?: string
}

export type Quiz = {
  id: string
  title: string
  questions: QuizQuestion[]
  openQuestions: string[]
}

/** Vérifie la structure d'un quiz JSON. Renvoie la liste des erreurs (vide si valide). */
export function validateQuiz(data: unknown, fileId: string): string[] {
  const errors: string[] = []
  const quiz = data as Partial<Quiz>
  if (typeof quiz !== 'object' || quiz === null) return [`${fileId} : n'est pas un objet`]
  if (quiz.id !== fileId) errors.push(`${fileId} : "id" doit valoir "${fileId}"`)
  if (typeof quiz.title !== 'string' || quiz.title === '') errors.push(`${fileId} : "title" manquant`)
  if (!Array.isArray(quiz.questions)) errors.push(`${fileId} : "questions" doit être un tableau`)
  if (!Array.isArray(quiz.openQuestions) || !quiz.openQuestions.every((q) => typeof q === 'string')) {
    errors.push(`${fileId} : "openQuestions" doit être un tableau de chaînes`)
  }
  ;(quiz.questions ?? []).forEach((q, i) => {
    const where = `${fileId} question ${i + 1}`
    if (typeof q.question !== 'string' || q.question === '') errors.push(`${where} : "question" manquant`)
    if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push(`${where} : au moins 2 "choices"`)
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer]
    if (answers.length === 0 || !answers.every((a) => Number.isInteger(a) && a >= 0 && a < (q.choices?.length ?? 0))) {
      errors.push(`${where} : "answer" hors des choix`)
    }
    if (typeof q.explanation !== 'string' || q.explanation === '') errors.push(`${where} : "explanation" manquant`)
    if (q.code !== undefined && typeof q.code !== 'string') errors.push(`${where} : "code" doit être une chaîne`)
    if (q.language !== undefined && typeof q.language !== 'string') errors.push(`${where} : "language" doit être une chaîne`)
  })
  return errors
}

const files = import.meta.glob('./quizzes/*.json', { import: 'default', eager: true }) as Record<string, unknown>

const quizzes = new Map<string, Quiz>()
for (const [path, data] of Object.entries(files)) {
  const id = path.replace(/^.*\//, '').replace(/\.json$/, '')
  const errors = validateQuiz(data, id)
  if (errors.length > 0) {
    // Un quiz invalide est ignoré (et signalé) plutôt que de casser l'application
    console.error(`Quiz "${id}" invalide :\n- ${errors.join('\n- ')}`)
    continue
  }
  quizzes.set(id, data as Quiz)
}

export function getQuiz(id: string): Quiz | undefined {
  return quizzes.get(id)
}

export function isMultiple(question: QuizQuestion): boolean {
  return Array.isArray(question.answer)
}

export function expectedAnswers(question: QuizQuestion): number[] {
  return Array.isArray(question.answer) ? [...question.answer].sort() : [question.answer]
}

export function codeLanguage(question: QuizQuestion): string {
  if (question.language) return question.language
  const code = question.code ?? ''
  return code.includes('<?php') || /\$[a-zA-Z_]/.test(code) ? 'php' : 'tsx'
}
