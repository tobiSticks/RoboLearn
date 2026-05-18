import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Flame, Medal, Star } from 'lucide-react'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: allProgress }, { data: allQuizResults }] = await Promise.all([
    supabase.from('lesson_progress').select('user_id, completed_at, status').eq('status', 'completed'),
    supabase.from('quiz_results').select('user_id, score, total'),
  ])

  // Aggregate lessons per user
  const userMap = new Map<string, { lessons: number; dates: string[]; quizPoints: number }>()

  for (const p of allProgress ?? []) {
    if (!userMap.has(p.user_id)) userMap.set(p.user_id, { lessons: 0, dates: [], quizPoints: 0 })
    const e = userMap.get(p.user_id)!
    e.lessons++
    if (p.completed_at) e.dates.push(new Date(p.completed_at).toDateString())
  }

  // Add quiz points (first attempt score × 5)
  for (const q of allQuizResults ?? []) {
    if (!userMap.has(q.user_id)) userMap.set(q.user_id, { lessons: 0, dates: [], quizPoints: 0 })
    userMap.get(q.user_id)!.quizPoints += q.score * 5
  }

  // Fetch profiles
  const userIds = [...userMap.keys()]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, show_in_directory').in('id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  function calcStreak(dates: string[]) {
    const sorted = [...new Set(dates)].map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime())
    let streak = 0
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let i = 0; i < sorted.length; i++) {
      const exp = new Date(today); exp.setDate(today.getDate() - i)
      if (sorted[i].toDateString() === exp.toDateString()) streak++
      else break
    }
    return streak
  }

  const leaderboard = userIds
    .map(uid => {
      const { lessons, dates, quizPoints } = userMap.get(uid)!
      const profile = profileMap.get(uid) as any
      const streak  = calcStreak(dates)
      const lessonPoints = lessons * 10
      const total   = lessonPoints + quizPoints
      return {
        uid,
        name:        profile?.full_name || 'Anonymous learner',
        canLink:     !!profile?.show_in_directory && !!profile?.full_name,
        lessons,
        quizPoints,
        lessonPoints,
        total,
        streak,
        isMe:        uid === user!.id,
      }
    })
    .sort((a, b) => b.total - a.total || b.streak - a.streak)

  const myRank    = leaderboard.findIndex(l => l.isMe) + 1
  const topTen    = leaderboard.slice(0, 10)
  const myEntry   = leaderboard.find(l => l.isMe)
  const showMyRow = myRank > 10 && myEntry
  const medalColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600']

  const Row = ({ entry, rank }: { entry: typeof leaderboard[0]; rank: number }) => (
    <div className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 rounded-xl border transition-all ${
      entry.isMe ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white border-gray-100 hover:border-gray-200'
    }`}>
      <div className="w-7 md:w-8 text-center flex-shrink-0">
        {rank <= 3
          ? <Medal className={`w-5 h-5 mx-auto ${medalColors[rank - 1]}`} />
          : <span className="text-sm font-bold text-gray-400">#{rank}</span>}
      </div>

      {/* Avatar / link */}
      {entry.canLink ? (
        <Link href={`/user/${entry.uid}`}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-400 transition-all"
          title="View profile">
          <span className="text-white text-sm font-bold">{entry.name.charAt(0).toUpperCase()}</span>
        </Link>
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">{entry.name.charAt(0).toUpperCase()}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate flex items-center gap-1 flex-wrap">
          {entry.canLink
            ? <Link href={`/user/${entry.uid}`} className="hover:text-blue-600 transition-colors">{entry.name}</Link>
            : entry.name}
          {entry.isMe && <span className="text-xs text-blue-500 font-normal">(you)</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {entry.streak > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-400">
              <Flame className="w-3 h-3" /> {entry.streak}d
            </span>
          )}
          <span className="text-xs text-gray-400">{entry.lessons} lessons · {entry.quizPoints} quiz pts</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-lg font-bold text-gray-900">{entry.total}</div>
        <div className="text-xs text-gray-400">pts</div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-3 mb-1">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
      </div>
      <p className="text-gray-500 text-sm mb-3">Ranked by total points.</p>

      {/* Scoring legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { icon: Trophy, label: 'Lesson complete', value: '+10 pts' },
          { icon: Star,   label: 'Quiz (per correct answer)', value: '+5 pts' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
            <Icon className="w-3.5 h-3.5 text-blue-500" />
            <span>{label}</span>
            <span className="font-semibold text-blue-600">{value}</span>
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No completions yet — be the first!</p>
        </div>
      )}

      <div className="space-y-2">
        {topTen.map((entry, i) => <Row key={entry.uid} entry={entry} rank={i + 1} />)}

        {showMyRow && (
          <>
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">your rank</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
            <Row entry={myEntry!} rank={myRank} />
          </>
        )}
      </div>
    </div>
  )
}
