import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LessonContent from '@/components/lesson/LessonContent'
import LessonTutor from '@/components/lesson/LessonTutor'
import LessonHeader from '@/components/lesson/LessonHeader'
import LessonLayout from '@/components/lesson/LessonLayout'
import type { Track, Module, Lesson, LessonProgress } from '@/lib/types'

type Props = {
  params: Promise<{ track: string; module: string; lesson: string }>
}

export default async function LessonPage({ params }: Props) {
  const { track: trackSlug, module: moduleSlug, lesson: lessonSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch track
  const { data: track } = await supabase
    .from('tracks').select('*').eq('slug', trackSlug).single()
  if (!track) notFound()

  // Fetch module
  const { data: module } = await supabase
    .from('modules').select('*').eq('slug', moduleSlug).single()
  if (!module) notFound()

  // Fetch lesson
  const { data: lesson } = await supabase
    .from('lessons').select('*').eq('slug', lessonSlug).single()
  if (!lesson) notFound()

  // Fetch all lessons in module for prev/next navigation
  const { data: moduleLessons } = await supabase
    .from('lessons').select('*')
    .eq('module_id', module.id).order('sort_order')

  // Fetch user progress for this lesson
  const { data: progress } = await supabase
    .from('lesson_progress').select('*')
    .eq('user_id', user!.id).eq('lesson_id', lesson.id).single()

  const currentIndex = (moduleLessons ?? []).findIndex((l: Lesson) => l.id === lesson.id)
  const prevLesson   = currentIndex > 0 ? moduleLessons![currentIndex - 1] : null
  const nextLesson   = currentIndex < (moduleLessons?.length ?? 0) - 1 ? moduleLessons![currentIndex + 1] : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <LessonHeader
        track={track as Track}
        module={module as Module}
        lesson={lesson as Lesson}
        progress={progress as LessonProgress | null}
        prevLesson={prevLesson as Lesson | null}
        nextLesson={nextLesson as Lesson | null}
        userId={user!.id}
      />
      <LessonLayout
        content={<LessonContent lesson={lesson as Lesson} />}
        tutor={<LessonTutor lesson={lesson as Lesson} userId={user!.id} />}
      />
    </div>
  )
}