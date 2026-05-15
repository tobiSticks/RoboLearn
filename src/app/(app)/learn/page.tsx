import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { getTrackColor } from '@/lib/utils'
import type { Track } from '@/lib/types'

export default async function LearnPage() {
  const supabase = await createClient()
  const { data: tracks } = await supabase.from('tracks').select('*').order('sort_order')

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Learning tracks</h1>
      <p className="text-gray-500 mb-8">Choose a track to start learning robotics from the ground up.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(tracks as Track[])?.map(track => {
          const colors = getTrackColor(track.slug)
          return (
            <Link key={track.id} href={`/learn/${track.slug}`}
              className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 hover:shadow-md transition-all group`}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <BookOpen className={`w-5 h-5 ${colors.text}`} />
              </div>
              <h2 className={`font-bold text-lg ${colors.text} mb-1`}>{track.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{track.description}</p>
              <div className={`flex items-center gap-1 text-sm font-medium ${colors.text}`}>
                Start track <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}