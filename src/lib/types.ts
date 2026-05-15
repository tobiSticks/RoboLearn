export type Track = {
  id: string
  slug: string
  title: string
  description: string
  color: string
  icon: string
  sort_order: number
}

export type Module = {
  id: string
  track_id: string
  slug: string
  title: string
  description: string
  sort_order: number
}

export type Lesson = {
  id: string
  module_id: string
  slug: string
  title: string
  description: string
  content_mdx: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  sort_order: number
  estimated_minutes: number
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export type Enrollment = {
  id: string
  user_id: string
  track_id: string
  enrolled_at: string
}

export type LessonProgress = {
  id: string
  user_id: string
  lesson_id: string
  status: 'in_progress' | 'completed'
  completed_at: string | null
}

export type ChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type ModuleWithLessons = Module & {
  lessons: Lesson[]
}

export type TrackWithModules = Track & {
  modules: ModuleWithLessons[]
}