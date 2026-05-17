import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Clock, Flame, Trophy } from 'lucide-react'
import { getTrackColor } from '@/lib/utils'
import type { Track, Enrollment, LessonProgress } from '@/lib/types'

function calcStreak(progress: LessonProgress[]): number {
  const completedDates = [...new Set(
    progress
      .filter(p => p.status === 'completed' && p.completed_at)
      .map(p => new Date(p.completed_at!).toDateString())
  )].map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime())

  if (!completedDates.length) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < completedDates.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    if (completedDates[i].toDateString() === expected.toDateString()) {
      streak++
    } else {
      // Allow today to not have activity yet (check yesterday as day 0)
      if (i === 0 && completedDates[0].toDateString() === new Date(today.getTime() - 86400000).toDateString()) {
        streak++
      } else {
        break
      }
    }
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: tracks }, { data: enrollments }, { data: progress }, { data: allLessons }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('tracks').select('*, modules(id, lessons(id))').order('sort_order'),
    supabase.from('enrollments').select('*').eq('user_id', user!.id),
    supabase.from('lesson_progress').select('*').eq('user_id', user!.id),
    supabase.from('lessons').select('id, module_id, modules!inner(track_id)'),
  ])

  const progressList = (progress as LessonProgress[] | null) ?? []
  const completedIds = new Set(progressList.filter(p => p.status === 'completed').map(p => p.lesson_id))
  const enrolledIds  = new Set((enrollments as Enrollment[] | null)?.map(e => e.track_id) ?? [])
  const streak       = calcStreak(progressList)

  // Build lesson count + completed count per track
  const lessonsByTrack = new Map<string, string[]>()
  for (const lesson of (allLessons as any[]) ?? []) {
    const trackId = lesson.modules?.track_id
    if (!trackId) continue
    if (!lessonsByTrack.has(trackId)) lessonsByTrack.set(trackId, [])
    lessonsByTrack.get(trackId)!.push(lesson.id)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="mb-6 md:mb-10">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Pick up where you left off.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-10">
        {[
          { label: 'Enrolled tracks',   value: enrolledIds.size,       icon: BookOpen    },
          { label: 'Lessons completed', value: completedIds.size,      icon: CheckCircle2 },
          { label: 'In progress',       value: progressList.filter(p => p.status !== 'completed').length, icon: Clock },
          { label: 'Day streak',        value: streak,                  icon: Flame       },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-5">
            <Icon className={`w-5 h-5 mb-3 ${label === 'Day streak' && streak > 0 ? 'text-orange-400' : 'text-gray-400'}`} />
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tracks with progress */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning tracks</h2>
      <div className="space-y-3">
        {(tracks as any[])?.map(track => {
          const colors       = getTrackColor(track.slug)
          const enrolled     = enrolledIds.has(track.id)
          const trackLessons = lessonsByTrack.get(track.id) ?? []
          const total        = trackLessons.length
          const done         = trackLessons.filter(id => completedIds.has(id)).length
          const pct          = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <Link key={track.id} href={`/learn/${track.slug}`}
              className="block bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <BookOpen className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{track.title}</div>
                    <div className="text-sm text-gray-500">{track.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {enrolled && pct === 100 && (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  )}
                  {enrolled && (
                    <span className="text-xs text-gray-500">{done}/{total}</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>

              {enrolled && total > 0 && (
                <div className="ml-14">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-yellow-400' : colors.text.replace('text-', 'bg-')}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
