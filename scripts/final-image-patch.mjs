import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'lesson-images'
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Better Wikipedia article names for the ones that had no thumbnail
// Plus retries for rate-limited ones
const TARGETS = {
  'imu-encoders-distance':       'Gyroscope',
  'what-is-ros2':                'Robotics',
  'first-ros2-node':             'Software_framework',
  'designing-a-gripper':         'Gripper',
  'motor-drivers-hbridges':      'Motor_controller',
  'joints-degrees-of-freedom':   'Revolute_joint',
  'intro-gazebo-rviz':           'Robot',
  'intro-to-fusion360':          'Computer-aided_design',
  'modeling-a-robot-link':       'Industrial_robot',
}

async function getWikipediaThumbnail(article) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${article}`,
    { headers: { 'User-Agent': 'RoboLearn/1.0 (educational platform)' } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.thumbnail?.source ?? data.originalimage?.source ?? null
}

async function fetchImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  return { buffer, contentType }
}

function mimeToExt(mime) {
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('png')) return 'png'
  if (mime.includes('svg')) return 'svg'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  return 'jpg'
}

async function run() {
  const { data: lessons } = await supabase.from('lessons').select('id, slug, content_mdx')
  const bySlug = Object.fromEntries(lessons.map(l => [l.slug, l]))

  for (const [slug, article] of Object.entries(TARGETS)) {
    const lesson = bySlug[slug]
    if (!lesson) continue

    // Skip if already has a Supabase URL
    const srcMatch = lesson.content_mdx?.match(/<Image\s+src="([^"]*)"/)
    if (srcMatch?.[1]?.includes('supabase')) {
      console.log(`Already done: ${slug}`)
      continue
    }

    console.log(`Processing: ${slug} → Wikipedia:${article}`)
    await sleep(2000)

    const thumbUrl = await getWikipediaThumbnail(article)
    if (!thumbUrl) { console.log(`  No thumbnail`); continue }

    try {
      const { buffer, contentType } = await fetchImage(thumbUrl)
      const ext = mimeToExt(contentType)
      const filename = `${slug}.${ext}`

      await supabase.storage.from(BUCKET).upload(filename, buffer, { contentType, upsert: true })
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

      const newMdx = lesson.content_mdx.replace(
        /<Image\s+src="([^"]*)"([^/]*)\/>/,
        (_, __, rest) => `<Image src="${publicUrl}"${rest}/>`
      )
      await supabase.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)
      console.log(`  ✓ Saved`)
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
    }
  }

  // Final count
  const { data: final } = await supabase.from('lessons').select('slug, content_mdx')
  const withSupabase = final.filter(l => l.content_mdx?.includes('supabase.co/storage'))
  const stillMissing = final.filter(l => {
    const m = l.content_mdx?.match(/<Image\s+src="([^"]*)"/)
    return m && !m[1].includes('supabase')
  })
  console.log(`\n✓ ${withSupabase.length} lessons have Supabase-hosted images`)
  if (stillMissing.length) console.log(`✗ Still missing: ${stillMissing.map(l => l.slug).join(', ')}`)
  else console.log('All lessons have images!')
}

run()
