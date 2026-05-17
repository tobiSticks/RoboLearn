import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'
import { CheckCircle2, Flame, BookOpen, Trophy } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: progress }, { data: enrollments }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('lesson_progress').select('*').eq('user_id', user!.id),
    supabase.from('enrollments').select('*').eq('user_id', user!.id),
  ])

  const completed = (progress ?? []).filter((p: any) => p.status === 'completed').length

  // Streak calc
  const dates = [...new Set(
    (progress ?? [])
      .filter((p: any) => p.completed_at)
      .map((p: any) => new Date(p.completed_at).toDateString())
  )].map((d: any) => new Date(d)).sort((a: any, b: any) => b - a)

  let streak = 0
  const today = new Date(); today.setHours(0,0,0,0)
  for (let i = 0; i < dates.length; i++) {
    const exp = new Date(today); exp.setDate(today.getDate() - i)
    if (dates[i].toDateString() === exp.toDateString()) streak++
    else break
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your profile</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { icon: CheckCircle2, label: 'Completed',  value: completed,             color: 'text-green-500'  },
          { icon: Flame,        label: 'Day streak', value: streak,                color: 'text-orange-400' },
          { icon: BookOpen,     label: 'Enrolled',   value: enrollments?.length ?? 0, color: 'text-blue-500'   },
          { icon: Trophy,       label: 'Rank',       value: '—',                   color: 'text-yellow-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <ProfileForm profile={profile} email={user!.email!} />
    </div>
  )
}
