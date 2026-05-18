import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Flame, Star, MessageCircle, AtSign, GitBranch, Trophy } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, bio_updated, discord_handle, twitter_handle, github_handle, show_in_directory')
    .eq('id', id)
    .single()

  if (!profile || !profile.full_name) notFound()

  const [{ data: progress }, { data: quizResults }, { data: enrollments }] = await Promise.all([
    supabase.from('lesson_progress').select('status, completed_at').eq('user_id', id),
    supabase.from('quiz_results').select('score, total').eq('user_id', id),
    supabase.from('enrollments').select('track_id').eq('user_id', id),
  ])

  const completed    = (progress ?? []).filter((p: any) => p.status === 'completed').length
  const quizPoints   = (quizResults ?? []).reduce((sum: number, q: any) => sum + q.score * 5, 0)
  const totalPoints  = completed * 10 + quizPoints
  const quizAvg      = quizResults?.length
    ? Math.round((quizResults.reduce((s: number, q: any) => s + (q.score / q.total) * 100, 0) / quizResults.length))
    : null

  // Streak
  const dates = [...new Set(
    (progress ?? []).filter((p: any) => p.completed_at)
      .map((p: any) => new Date(p.completed_at).toDateString())
  )].map((d: any) => new Date(d)).sort((a: any, b: any) => b - a)
  let streak = 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i < dates.length; i++) {
    const exp = new Date(today); exp.setDate(today.getDate() - i)
    if (dates[i].toDateString() === exp.toDateString()) streak++
    else break
  }

  const initials = profile.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const hasSocials = profile.discord_handle || profile.twitter_handle || profile.github_handle

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <Link href="/leaderboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to leaderboard
      </Link>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-bold">{initials}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
          {profile.bio_updated && (
            <p className="text-sm text-gray-500 mt-0.5">{profile.bio_updated}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Trophy, label: 'Total points', value: totalPoints,  color: 'text-blue-500'   },
          { icon: BookOpen,label: 'Lessons done', value: completed,    color: 'text-green-500'  },
          { icon: Flame,   label: 'Day streak',  value: streak,       color: 'text-orange-400' },
          { icon: Star,    label: 'Quiz avg',    value: quizAvg !== null ? `${quizAvg}%` : '—', color: 'text-yellow-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Social handles */}
      {profile.show_in_directory && hasSocials && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Connect</h2>
          <div className="flex flex-wrap gap-2">
            {profile.discord_handle && (
              <span className="flex items-center gap-1.5 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium">
                <MessageCircle className="w-3.5 h-3.5" /> {profile.discord_handle}
              </span>
            )}
            {profile.twitter_handle && (
              <a href={`https://twitter.com/${profile.twitter_handle.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm bg-sky-50 text-sky-600 px-3 py-1.5 rounded-full font-medium hover:bg-sky-100 transition-colors">
                <AtSign className="w-3.5 h-3.5" /> {profile.twitter_handle}
              </a>
            )}
            {profile.github_handle && (
              <a href={`https://github.com/${profile.github_handle}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">
                <GitBranch className="w-3.5 h-3.5" /> {profile.github_handle}
              </a>
            )}
          </div>
        </div>
      )}

      {!profile.show_in_directory && (
        <p className="text-sm text-gray-400 text-center mt-4">This user hasn't enabled their public profile yet.</p>
      )}
    </div>
  )
}
