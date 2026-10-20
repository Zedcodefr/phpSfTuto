import { useState } from 'react'
import { codeLanguage, expectedAnswers, getQuiz, isMultiple, type Quiz } from '../content/quiz'
import { useQuizResults } from '../lib/progress'
import { useTrack } from '../lib/track'
import { Markdown } from './Markdown'

export function QuizBlock({ id }: { id: string }) {
  const quiz = getQuiz(id)

  if (!quiz) {
    return (
      <section className="quiz quiz-empty">
        <h2>🧠 Quiz de compréhension</h2>
        <p className="muted">Le quiz de ce chapitre est en cours de préparation.</p>
      </section>
    )
  }

  // key : on repart d'un état neuf si on change de quiz
  return <QuizForm key={quiz.id} quiz={quiz} />
}

/** Rend les `extraits de code` entre backticks d'un texte de quiz */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 1 ? <code key={i}>{part.slice(1, -1)}</code> : part,
      )}
    </>
  )
}

function sameAnswers(a: number[], b: number[]): boolean {
  return a.length === b.length && [...a].sort().every((value, i) => value === b[i])
}

function QuizForm({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<number[][]>(() => quiz.questions.map(() => []))
  const [submitted, setSubmitted] = useState(false)
  const [results, saveResult] = useQuizResults(useTrack())
  const previous = results[quiz.id]

  const select = (questionIndex: number, choiceIndex: number, multiple: boolean) => {
    if (submitted) return
    setAnswers((current) =>
      current.map((selected, i) => {
        if (i !== questionIndex) return selected
        if (!multiple) return [choiceIndex]
        return selected.includes(choiceIndex) ? selected.filter((c) => c !== choiceIndex) : [...selected, choiceIndex]
      }),
    )
  }

  const score = quiz.questions.filter((q, i) => sameAnswers(answers[i], expectedAnswers(q))).length
  const complete = answers.every((selected) => selected.length > 0)

  const submit = () => {
    setSubmitted(true)
    saveResult(quiz.id, { score, total: quiz.questions.length, date: new Date().toISOString() })
  }

  const reset = () => {
    setAnswers(quiz.questions.map(() => []))
    setSubmitted(false)
  }

  return (
    <section className="quiz" aria-labelledby={`quiz-${quiz.id}`}>
      <div className="quiz-header">
        <h2 id={`quiz-${quiz.id}`}>🧠 Quiz — {quiz.title}</h2>
        {previous && !submitted && (
          <span className="badge">
            Dernier score : {previous.score}/{previous.total}
          </span>
        )}
      </div>
      <p className="muted small">Répondez d’abord seul : le but est de mesurer ce que vous avez compris, pas ce que l’IA sait.</p>

      <ol className="quiz-questions">
        {quiz.questions.map((question, qi) => {
          const multiple = isMultiple(question)
          const expected = expectedAnswers(question)
          const correct = sameAnswers(answers[qi], expected)
          return (
            <li key={qi} className={`quiz-question ${submitted ? (correct ? 'is-correct' : 'is-wrong') : ''}`}>
              <p className="quiz-text">
                <Inline text={question.question} />
              </p>
              {question.code && <Markdown basePath="">{'```' + codeLanguage(question) + '\n' + question.code + '\n```'}</Markdown>}
              {multiple && <p className="muted small">Plusieurs réponses possibles.</p>}
              <ul className="quiz-choices">
                {question.choices.map((choice, ci) => {
                  const checked = answers[qi].includes(ci)
                  const state = submitted ? (expected.includes(ci) ? 'expected' : checked ? 'wrong' : '') : ''
                  return (
                    <li key={ci}>
                      <label className={`quiz-choice ${checked ? 'checked' : ''} ${state}`}>
                        <input
                          type={multiple ? 'checkbox' : 'radio'}
                          name={`${quiz.id}-${qi}`}
                          checked={checked}
                          disabled={submitted}
                          onChange={() => select(qi, ci, multiple)}
                        />
                        <span>
                          <Inline text={choice} />
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              {submitted && (
                <div className="quiz-explanation">
                  <strong>{correct ? '✅ Bonne réponse.' : '❌ Pas tout à fait.'}</strong> <Inline text={question.explanation} />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="quiz-actions">
        {submitted ? (
          <>
            <p className="quiz-score">
              Score : <strong>{score}/{quiz.questions.length}</strong>
              {score === quiz.questions.length ? ' 🎉' : ' — relisez les explications puis réessayez.'}
            </p>
            <button type="button" className="button" onClick={reset}>
              Recommencer
            </button>
          </>
        ) : (
          <button type="button" className="button primary" onClick={submit} disabled={!complete}>
            Valider mes réponses
          </button>
        )}
      </div>

      {quiz.openQuestions.length > 0 && (
        <div className="open-questions">
          <h3>🎤 Questions à savoir expliquer à l’oral au formateur (avec vos mots, sur votre code)</h3>
          <ul>
            {quiz.openQuestions.map((question) => (
              <li key={question}>
                <Inline text={question} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
