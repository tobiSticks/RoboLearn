import ytsr from '@distube/ytsr'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function searchYouTube(query) {
  try {
    const results = await ytsr(query, { limit: 5 })
    const video = results.items.find(i => i.type === 'video' && !i.isLive)
    if (!video) return null
    return { id: video.id, title: video.name }
  } catch {
    return null
  }
}

function isValidYouTubeId(id) {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

function replaceYouTubeId(mdx, newId) {
  // Replace any <YouTube id="..." /> with a valid real ID
  return mdx.replace(
    /<YouTube\s+id="([^"]*)"(\s+title="([^"]*)")?[^/]*\/>/g,
    (match, oldId, _, title) => {
      if (isValidYouTubeId(oldId)) return match // already has a real ID, skip
      return `<YouTube id="${newId}" title="${title ?? ''}" />`
    }
  )
}

async function run() {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, slug, title, content_mdx')

  if (error) { console.error(error); process.exit(1) }

  const needsVideo = lessons.filter(l => {
    if (!l.content_mdx) return false
    const match = l.content_mdx.match(/<YouTube\s+id="([^"]*)"/)
    return match && !isValidYouTubeId(match[1])
  })

  console.log(`\n${needsVideo.length} lessons need a real YouTube video.\n`)

  for (const lesson of needsVideo) {
    const query = `${lesson.title} robotics tutorial`
    console.log(`Searching: "${query}"...`)

    const video = await searchYouTube(query)
    if (!video || !isValidYouTubeId(video.id)) {
      console.log(`  No result found, skipping.`)
      continue
    }

    console.log(`  Found: "${video.title}" (${video.id})`)

    const updatedMdx = replaceYouTubeId(lesson.content_mdx, video.id)
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ content_mdx: updatedMdx })
      .eq('id', lesson.id)

    if (updateError) {
      console.error(`  Error saving ${lesson.slug}:`, updateError.message)
    } else {
      console.log(`  Saved: ${lesson.slug}`)
    }

    // Be polite to the free API
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\nAll done!')
}

run()
