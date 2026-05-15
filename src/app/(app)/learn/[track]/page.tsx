import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react'
import { getTrackColor, getDifficultyColor, formatMinutes } from '@/lib/utils'
import type { Module, Lesson, LessonProgress } from '@/lib/types'

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: trackSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: track } = await supabase
    .from('tracks').select('*').eq('slug', trackSlug).single()
  if (!track) notFound()

  const { data: modules } = await supabase
    .from('modules').select('*, lessons(*)')
    .eq('track_id', track.id).order('sort_order')

  const { data: progressRows } = await supabase
    .from('lesson_progress').select('*').eq('user_id', user!.id)

  const { data: enrollment } = await supabase
    .from('enrollments').select('*')
    .eq('user_id', user!.id).eq('track_id', track.id).single()

  const progressMap = new Map((progressRows as LessonProgress[] | null)?.map(p => [p.lesson_id, p]) ?? [])
  const colors = getTrackColor(track.slug)

  async function handleEnroll() {
    'use server'
    const sb = await createClient()
    const { data: { user: u } } = await sb.auth.getUser()
    await sb.from('enrollments').upsert({ user_id: u!.id, track_id: track.id })
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Track header */}
      <div className={`rounded-2xl ${colors.bg} border ${colors.border} p-8 mb-8`}>
        <h1 className={`text-2xl font-bold ${colors.text} mb-2`}>{track.title} track</h1>
        <p className="text-gray-600 mb-4">{track.description}</p>
        {!enrollment && (
          <form action={handleEnroll}>
            <button type="submit"
              className={`text-sm font-medium px-4 py-2 rounded-lg bg-white border ${colors.border} ${colors.text} hover:shadow-sm transition-all`}>
              Enroll in this track
            </button>
          </form>
        )}
        {enrollment && (
          <span className="text-xs bg-white text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
            ✓ Enrolled
          </span>
        )}
      </div>

      {/* Modules & lessons */}
      <div className="space-y-6">
        {(modules as (Module & { lessons: Lesson[] })[])?.map((mod, mi) => (
          <div key={mod.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center text-xs font-bold`}>
                {mi + 1}
              </span>
              <div>
                <h2 className="font-semibold text-gray-900">{mod.title}</h2>
                <p className="text-xs text-gray-500">{mod.description}</p>
              </div>
            </div>
            <div>
              {mod.lessons?.sort((a, b) => a.sort_order - b.sort_order).map((lesson, li) => {
                const prog    = progressMap.get(lesson.id)
                const done    = prog?.status === 'completed'
                return (
                  <Link key={lesson.id} href={`/learn/${trackSlug}/${mod.slug}/${lesson.slug}`}
                    className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                    {done
                      ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{mi + 1}.{li + 1}</span>
                        <span className="font-medium text-gray-900 text-sm">{lesson.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                          {lesson.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{lesson.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {formatMinutes(lesson.estimated_minutes)}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}