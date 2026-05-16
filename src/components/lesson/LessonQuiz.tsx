'use client'
import { useState } from 'react'
import { Loader2, Trophy, RefreshCw, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lesson } from '@/lib/types'

type Question = {
  question: string
  options: string[]
  correct: number
  explanation: string
}

type Props = { lesson: Lesson }

export default function LessonQuiz({ lesson }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'active' | 'done'>('idle')
  const [questions, setQuestions]   = useState<Question[]>([])
  const [current, setCurrent]       = useState(0)
  const [selected, setSelected]     = useState<number | null>(null)
  const [answers, setAnswers]       = useState<boolean[]>([])
  const [error, setError]           = useState('')

  async function startQuiz() {
    setState('loading')
    setError('')
    setAnswers([])
    setCurrent(0)
    setSelected(null)

    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonTitle: lesson.title,
        lessonDescription: lesson.description,
        difficulty: lesson.difficulty,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error ?? 'Failed to generate quiz')
      setState('idle')
      return
    }
    setQuestions(data.questions)
    setState('active')
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
  }

  function next() {
    const correct = selected === questions[current].correct
    const newAnswers = [...answers, correct]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 >= questions.length) {
      setState('done')
    } else {
      setCurrent(current + 1)
    }
  }

  const score = answers.filter(Boolean).length

  if (state === 'idle') return (
    <div className="mt-8 border-t border-gray-100 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Test yourself</h3>
          <p className="text-sm text-gray-500 mt-0.5">4 questions on {lesson.title}</p>
        </div>
        <button onClick={startQuiz}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Start quiz <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  )

  if (state === 'loading') return (
    <div className="mt-8 border-t border-gray-100 pt-8 flex items-center gap-3 text-gray-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Generating quiz questions...</span>
    </div>
  )

  if (state === 'done') {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="mt-8 border-t border-gray-100 pt-8">
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <Trophy className={`w-10 h-10 mx-auto mb-3 ${pct >= 75 ? 'text-yellow-400' : 'text-gray-300'}`} />
          <h3 className="text-xl font-bold text-gray-900">{score}/{questions.length} correct</h3>
          <p className="text-gray-500 mt-1 text-sm">
            {pct === 100 ? 'Perfect score! 🎉' : pct >= 75 ? 'Great job!' : pct >= 50 ? 'Good effort — review the lesson and try again.' : 'Keep studying and try again.'}
          </p>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <button onClick={startQuiz}
            className="mt-5 flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      </div>
    )
  }

  const q = questions[current]
  return (
    <div className="mt-8 border-t border-gray-100 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Question {current + 1} of {questions.length}</h3>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < current ? (answers[i] ? 'bg-green-400' : 'bg-red-400') : i === current ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <p className="text-gray-900 font-medium mb-4">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const isSelected = selected === idx
          const isCorrect  = idx === q.correct
          const revealed   = selected !== null
          return (
            <button key={idx} onClick={() => handleAnswer(idx)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all',
                !revealed && 'border-gray-200 hover:border-blue-300 hover:bg-blue-50',
                revealed && isCorrect && 'border-green-400 bg-green-50 text-green-800',
                revealed && isSelected && !isCorrect && 'border-red-400 bg-red-50 text-red-800',
                revealed && !isSelected && !isCorrect && 'border-gray-100 text-gray-400',
              )}>
              <div className="flex items-center gap-3">
                {revealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                {revealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                {(!revealed || (!isCorrect && !isSelected)) && <div className="w-4 h-4 flex-shrink-0" />}
                {opt}
              </div>
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">{q.explanation}</p>
          <button onClick={next}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            {current + 1 >= questions.length ? 'See results' : 'Next question'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
