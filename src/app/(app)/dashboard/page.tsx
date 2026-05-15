import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { getTrackColor } from '@/lib/utils'
import type { Track, Enrollment, LessonProgress } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: tracks }, { data: enrollments }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('tracks').select('*').order('sort_order'),
    supabase.from('enrollments').select('*').eq('user_id', user!.id),
    supabase.from('lesson_progress').select('*').eq('user_id', user!.id),
  ])

  const completedCount = (progress as LessonProgress[] | null)?.filter(p => p.status === 'completed').length ?? 0
  const enrolledIds    = (enrollments as Enrollment[] | null)?.map(e => e.track_id) ?? []

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Pick up where you left off.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Enrolled tracks',     value: enrolledIds.length, icon: BookOpen   },
          { label: 'Lessons completed',   value: completedCount,     icon: CheckCircle2 },
          { label: 'Lessons in progress', value: (progress?.length ?? 0) - completedCount, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-5">
            <Icon className="w-5 h-5 text-gray-400 mb-3" />
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tracks */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning tracks</h2>
      <div className="space-y-3">
        {(tracks as Track[])?.map(track => {
          const colors    = getTrackColor(track.slug)
          const enrolled  = enrolledIds.includes(track.id)
          return (
            <Link key={track.id} href={`/learn/${track.slug}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <BookOpen className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{track.title}</div>
                  <div className="text-sm text-gray-500">{track.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {enrolled && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Enrolled</span>
                )}
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}