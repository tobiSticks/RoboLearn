import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function toWeserv(url) {
  // Strip https:// before passing to weserv
  const stripped = url.replace(/^https?:\/\//, '')
  return `https://images.weserv.nl/?url=${stripped}`
}

async function run() {
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, slug, content_mdx')

  let updated = 0
  for (const lesson of lessons) {
    if (!lesson.content_mdx) continue

    const newMdx = lesson.content_mdx.replace(
      /<Image\s+src="(https?:\/\/upload\.wikimedia\.org[^"]*)"([^/]*)\/>/g,
      (match, url, rest) => `<Image src="${toWeserv(url)}"${rest}/>`
    )

    if (newMdx === lesson.content_mdx) continue // nothing changed

    const { error } = await supabase
      .from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)

    if (error) console.error(`Error: ${lesson.slug}:`, error.message)
    else { console.log(`Updated: ${lesson.slug}`); updated++ }
  }

  console.log(`\nDone! Proxied images in ${updated} lessons.`)
}

run()
