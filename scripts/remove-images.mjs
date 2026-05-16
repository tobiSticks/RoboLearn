import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const BUCKET = 'lesson-images'

// Delete all files from storage bucket
const { data: files } = await sb.storage.from(BUCKET).list()
if (files?.length) {
  const names = files.map(f => f.name)
  await sb.storage.from(BUCKET).remove(names)
  console.log(`Deleted ${names.length} files from storage.`)
}

// Reset all Image src back to PLACEHOLDER in lesson content
const { data: lessons } = await sb.from('lessons').select('id, slug, content_mdx')
let updated = 0
for (const lesson of lessons) {
  if (!lesson.content_mdx?.includes('<Image')) continue
  const newMdx = lesson.content_mdx.replace(
    /<Image\s+src="[^"]*"([^/]*)\/>/g,
    (_, rest) => `<Image src="PLACEHOLDER"${rest}/>`
  )
  if (newMdx === lesson.content_mdx) continue
  await sb.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)
  console.log(`Reset: ${lesson.slug}`)
  updated++
}

console.log(`\nDone! Cleared ${updated} lessons and deleted storage files.`)
