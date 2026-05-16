import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Delete all files from storage
const { data: files } = await sb.storage.from('lesson-images').list()
if (files?.length) {
  await sb.storage.from('lesson-images').remove(files.map(f => f.name))
  console.log(`Deleted ${files.length} files from storage.`)
}

// Remove all <Image ... /> tags from lesson content
const { data: lessons } = await sb.from('lessons').select('id, slug, content_mdx')
let updated = 0
for (const lesson of lessons) {
  if (!lesson.content_mdx?.includes('<Image')) continue
  const newMdx = lesson.content_mdx.replace(/<Image\s[^>]*\/>\n?/g, '')
  if (newMdx === lesson.content_mdx) continue
  await sb.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)
  console.log(`Stripped: ${lesson.slug}`)
  updated++
}

console.log(`\nDone! Removed images from ${updated} lessons.`)
