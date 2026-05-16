import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Clock, ChevronRight } from 'lucide-react'
import { getDifficultyColor, formatMinutes } from '@/lib/utils'

type Props = { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const supabase = await createClient()

  const { data: results } = query
    ? await supabase
        .from('lessons')
        .select('*, modules!inner(slug, title, tracks!inner(slug, title))')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('title')
        .limit(30)
    : { data: [] }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {query ? `Results for "${query}"` : 'Search lessons'}
      </h1>

      {!query && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Type in the search bar to find lessons</p>
        </div>
      )}

      {query && results?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No lessons found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords</p>
        </div>
      )}

      {(results?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-4">{results!.length} lesson{results!.length !== 1 ? 's' : ''} found</p>
          {results!.map((lesson: any) => {
            const track  = lesson.modules?.tracks
            const module = lesson.modules
            const href   = `/learn/${track?.slug}/${module?.slug}/${lesson.slug}`
            return (
              <Link key={lesson.id} href={href}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4 hover:border-gray-200 hover:shadow-sm transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{track?.title} → {module?.title}</span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{lesson.description}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatMinutes(lesson.estimated_minutes)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
