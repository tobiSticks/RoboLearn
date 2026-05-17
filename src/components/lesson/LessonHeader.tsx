'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, ArrowLeft } from 'lucide-react'
import { getTrackColor, getDifficultyColor, formatMinutes } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Track, Module, Lesson, LessonProgress } from '@/lib/types'
import { useState } from 'react'

type Props = {
  track: Track
  module: Module
  lesson: Lesson
  progress: LessonProgress | null
  prevLesson: Lesson | null
  nextLesson: Lesson | null
  userId: string
}

export default function LessonHeader({ track, module, lesson, progress, prevLesson, nextLesson, userId }: Props) {
  const [done, setDone]       = useState(progress?.status === 'completed')
  const [marking, setMarking] = useState(false)
  const router  = useRouter()
  const supabase = createClient()
  const colors  = getTrackColor(track.slug)

  async function markComplete() {
    setMarking(true)
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lesson.id)
      .single()

    if (existing) {
      await supabase.from('lesson_progress')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('lesson_progress').insert({
        user_id:      userId,
        lesson_id:    lesson.id,
        status:       'completed',
        completed_at: new Date().toISOString(),
      })
    }

    setDone(true)
    setMarking(false)
    if (nextLesson) {
      router.push(`/learn/${track.slug}/${module.slug}/${nextLesson.slug}`)
    }
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Left: breadcrumb + back */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href={`/learn/${track.slug}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className={`font-medium ${colors.text}`}>{track.title}</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 truncate">{module.title}</span>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900 truncate">{lesson.title}</span>
      </div>

      {/* Right: meta + actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(lesson.difficulty)}`}>
          {lesson.difficulty}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {formatMinutes(lesson.estimated_minutes)}
        </div>

        {/* Prev */}
        {prevLesson && (
          <Link href={`/learn/${track.slug}/${module.slug}/${prevLesson.slug}`}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title={prevLesson.title}>
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </Link>
        )}

        {/* Next / Mark complete */}
        {done ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </span>
            {nextLesson && (
              <Link href={`/learn/${track.slug}/${module.slug}/${nextLesson.slug}`}
                className={cn('flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors', `${colors.bg} ${colors.text} border ${colors.border}`)}>
                Next <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <button onClick={markComplete} disabled={marking}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
            <CheckCircle2 className="w-4 h-4" />
            {marking ? 'Saving...' : nextLesson ? 'Complete & next' : 'Mark complete'}
          </button>
        )}
      </div>
    </header>
  )
}