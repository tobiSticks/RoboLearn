import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Clock, Play, Zap } from 'lucide-react'
import { getTrackColor, getDifficultyColor, formatMinutes } from '@/lib/utils'
import type { Track } from '@/lib/types'

export default async function LearnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tracks }, { data: enrollments }, { data: progress }, { data: allLessons }] = await Promise.all([
    supabase.from('tracks').select('*').order('sort_order'),
    supabase.from('enrollments').select('*').eq('user_id', user!.id),
    supabase.from('lesson_progress').select('*, lessons!inner(id, title, description, difficulty, estimated_minutes, slug, modules!inner(slug, title, tracks!inner(slug, title, color)))').eq('user_id', user!.id).order('updated_at', { ascending: false }),
    supabase.from('lessons').select('id, module_id, modules!inner(track_id)'),
  ])

  const enrolledIds  = new Set((enrollments ?? []).map((e: any) => e.track_id))
  const completedIds = new Set((progress ?? []).filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id))

  // Most recent in-progress lesson, or fallback to last completed
  const continueLesson = (progress ?? []).find((p: any) => p.status === 'in_progress')
    ?? (progress ?? [])[0]

  // Build lesson counts per track
  const lessonsByTrack = new Map<string, string[]>()
  for (const l of (allLessons as any[]) ?? []) {
    const tid = l.modules?.track_id
    if (!tid) continue
    if (!lessonsByTrack.has(tid)) lessonsByTrack.set(tid, [])
    lessonsByTrack.get(tid)!.push(l.id)
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      {/* Continue learning banner */}
      {continueLesson && (() => {
        const lesson = continueLesson.lessons as any
        const mod    = lesson?.modules
        const track  = mod?.tracks
        const colors = getTrackColor(track?.slug ?? '')
        const href   = `/learn/${track?.slug}/${mod?.slug}/${lesson?.slug}`
        const done   = continueLesson.status === 'completed'
        return (
          <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 mb-10`}>
            <div className="flex items-center gap-2 mb-3">
              {done
                ? <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
                : <Zap className={`w-4 h-4 ${colors.text}`} />}
              <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                {done ? 'Last completed' : 'Continue learning'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{lesson?.title}</h2>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{lesson?.description}</p>
            <div className="flex items-center gap-4">
              <Link href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white border ${colors.border} ${colors.text} text-sm font-medium hover:shadow-sm transition-all`}>
                <Play className="w-3.5 h-3.5" />
                {done ? 'Review lesson' : 'Continue'}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatMinutes(lesson?.estimated_minutes)}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(lesson?.difficulty)}`}>
                {lesson?.difficulty}
              </span>
            </div>
          </div>
        )
      })()}

      {/* Tracks */}
      <h1 className="text-xl font-bold text-gray-900 mb-1">Learning tracks</h1>
      <p className="text-gray-500 text-sm mb-6">
        {enrolledIds.size === 0
          ? 'Choose a track to start learning robotics from the ground up.'
          : `You're enrolled in ${enrolledIds.size} track${enrolledIds.size !== 1 ? 's' : ''}.`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(tracks as Track[])?.map(track => {
          const colors       = getTrackColor(track.slug)
          const enrolled     = enrolledIds.has(track.id)
          const trackLessons = lessonsByTrack.get(track.id) ?? []
          const total        = trackLessons.length
          const done         = trackLessons.filter(id => completedIds.has(id)).length
          const pct          = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <Link key={track.id} href={`/learn/${track.slug}`}
              className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 hover:shadow-md transition-all group flex flex-col`}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm flex-shrink-0">
                <BookOpen className={`w-5 h-5 ${colors.text}`} />
              </div>
              <h2 className={`font-bold text-lg ${colors.text} mb-1`}>{track.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{track.description}</p>

              {enrolled && total > 0 ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400">{done}/{total} lessons</span>
                    <span className={`text-xs font-medium ${colors.text}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors.text.replace('text-', 'bg-')} transition-all`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <span className="text-xs text-gray-400">{total} lessons</span>
                </div>
              )}

              <div className={`flex items-center gap-1 text-sm font-medium ${colors.text}`}>
                {enrolled ? 'Continue track' : 'Start track'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick stats if enrolled */}
      {enrolledIds.size > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Lessons completed', value: completedIds.size },
            { label: 'Tracks enrolled',   value: enrolledIds.size  },
            { label: 'Total lessons',     value: (allLessons?.length ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
