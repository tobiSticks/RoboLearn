import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, score, total } = await req.json()
  if (!lessonId || score === undefined || !total) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Check if a result already exists — first attempt only
  const { data: existing } = await supabase
    .from('quiz_results')
    .select('id, score, total')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  if (existing) {
    return NextResponse.json({ saved: false, existing: true, score: existing.score, total: existing.total })
  }

  const { error } = await supabase.from('quiz_results').insert({
    user_id:   user.id,
    lesson_id: lessonId,
    score,
    total,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: true })
}
