import { createClient } from '@/lib/supabase/server'
import { Trophy, Flame, Medal } from 'lucide-react'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all completed progress with user info
  const { data: allProgress } = await supabase
    .from('lesson_progress')
    .select('user_id, completed_at, status')
    .eq('status', 'completed')

  // Aggregate by user
  const userMap = new Map<string, { count: number; dates: string[] }>()
  for (const p of allProgress ?? []) {
    if (!userMap.has(p.user_id)) userMap.set(p.user_id, { count: 0, dates: [] })
    const entry = userMap.get(p.user_id)!
    entry.count++
    if (p.completed_at) entry.dates.push(new Date(p.completed_at).toDateString())
  }

  // Fetch profiles for all users
  const userIds = [...userMap.keys()]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  // Calculate streak per user
  function calcStreak(dates: string[]) {
    const sorted = [...new Set(dates)].map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime())
    let streak = 0
    const today = new Date(); today.setHours(0,0,0,0)
    for (let i = 0; i < sorted.length; i++) {
      const exp = new Date(today); exp.setDate(today.getDate() - i)
      if (sorted[i].toDateString() === exp.toDateString()) streak++
      else break
    }
    return streak
  }

  // Build leaderboard sorted by lessons completed
  const leaderboard = userIds
    .map(uid => {
      const { count, dates } = userMap.get(uid)!
      const profile = profileMap.get(uid) as any
      return {
        uid,
        name:   profile?.full_name || 'Anonymous learner',
        count,
        streak: calcStreak(dates),
        isMe:   uid === user!.id,
      }
    })
    .sort((a, b) => b.count - a.count || b.streak - a.streak)

  const myRank   = leaderboard.findIndex(l => l.isMe) + 1
  const topTen   = leaderboard.slice(0, 10)
  const myEntry  = leaderboard.find(l => l.isMe)
  const showMyRow = myRank > 10 && myEntry

  const medalColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600']

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">Top learners ranked by lessons completed.</p>

      {leaderboard.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No completions yet — be the first!</p>
        </div>
      )}

      <div className="space-y-2">
        {topTen.map((entry, i) => (
          <div key={entry.uid}
            className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all ${
              entry.isMe
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}>
            {/* Rank */}
            <div className="w-8 text-center flex-shrink-0">
              {i < 3
                ? <Medal className={`w-5 h-5 mx-auto ${medalColors[i]}`} />
                : <span className="text-sm font-bold text-gray-400">#{i + 1}</span>}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {entry.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {entry.name} {entry.isMe && <span className="text-xs text-blue-500 font-normal ml-1">(you)</span>}
              </div>
              {entry.streak > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-400 mt-0.5">
                  <Flame className="w-3 h-3" /> {entry.streak} day streak
                </div>
              )}
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-gray-900">{entry.count}</div>
              <div className="text-xs text-gray-400">lessons</div>
            </div>
          </div>
        ))}

        {/* User's own rank if outside top 10 */}
        {showMyRow && (
          <>
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">your rank</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl border bg-blue-50 border-blue-200 ring-1 ring-blue-300">
              <div className="w-8 text-center flex-shrink-0">
                <span className="text-sm font-bold text-gray-400">#{myRank}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{myEntry!.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {myEntry!.name} <span className="text-xs text-blue-500 font-normal ml-1">(you)</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-gray-900">{myEntry!.count}</div>
                <div className="text-xs text-gray-400">lessons</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
