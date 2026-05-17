import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, GitBranch, AtSign, MessageCircle, BookOpen } from 'lucide-react'

export default async function CommunityPage() {
  const supabase = await createClient()

  // Only show opted-in users with at least a name
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, bio_updated, discord_handle, twitter_handle, github_handle')
    .eq('show_in_directory', true)
    .not('full_name', 'is', null)
    .order('full_name')

  // Get lesson completion counts for each member
  const memberIds = (members ?? []).map((m: any) => m.id)
  const { data: progress } = memberIds.length
    ? await supabase.from('lesson_progress').select('user_id').eq('status', 'completed').in('user_id', memberIds)
    : { data: [] }

  const countMap = new Map<string, number>()
  for (const p of progress ?? []) {
    countMap.set(p.user_id, (countMap.get(p.user_id) ?? 0) + 1)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-900">Learners directory</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Connect with other RoboLearn students. Only users who opted in appear here.
      </p>

      {(!members || members.length === 0) && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-gray-200 mb-4" />
          <p className="font-medium text-gray-500">No one in the directory yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Be the first —{' '}
            <Link href="/profile" className="text-blue-500 hover:underline">update your profile</Link>
            {' '}and turn on "Show me in the Learners directory".
          </p>
        </div>
      )}

      {members && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(members as any[]).map(member => {
            const lessons = countMap.get(member.id) ?? 0
            const initials = (member.full_name ?? '?')
              .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

            return (
              <div key={member.id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{member.full_name}</div>
                    {member.bio_updated && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{member.bio_updated}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <BookOpen className="w-3 h-3" />
                      {lessons} lesson{lessons !== 1 ? 's' : ''} completed
                    </div>
                  </div>
                </div>

                {/* Social handles */}
                {(member.discord_handle || member.twitter_handle || member.github_handle) && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                    {member.discord_handle && (
                      <span className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                        <MessageCircle className="w-3 h-3" /> {member.discord_handle}
                      </span>
                    )}
                    {member.twitter_handle && (
                      <a href={`https://twitter.com/${member.twitter_handle.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full font-medium hover:bg-sky-100 transition-colors">
                        <AtSign className="w-3 h-3" /> {member.twitter_handle}
                      </a>
                    )}
                    {member.github_handle && (
                      <a href={`https://github.com/${member.github_handle}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium hover:bg-gray-200 transition-colors">
                        <GitBranch className="w-3 h-3" /> {member.github_handle}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
