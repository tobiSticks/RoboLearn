import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const BUCKET = 'lesson-images'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function ensureBucket() {
  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await sb.storage.createBucket(BUCKET, { public: true })
  }
}

async function generateAndUpload(slug, altText) {
  // Craft a prompt that produces clean educational diagrams
  const prompt = `technical educational diagram: ${altText}, clean flat illustration, blueprint style, white background, labeled components, professional textbook quality`
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true&model=flux&seed=${slug.length * 7}`

  console.log(`  Generating: "${altText.slice(0, 60)}..."`)

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' }
  })
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`)

  const buffer = await res.arrayBuffer()
  const filename = `${slug}.jpg`

  await sb.storage.from(BUCKET).upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })
  const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(filename)
  return publicUrl
}

async function run() {
  await ensureBucket()

  const { data: lessons } = await sb.from('lessons').select('id, slug, content_mdx')
  const needsImage = lessons.filter(l => {
    const m = l.content_mdx?.match(/<Image\s+src="([^"]*)"/)
    return m && (m[1] === 'PLACEHOLDER' || !m[1].startsWith('http'))
  })

  console.log(`\n${needsImage.length} lessons need images.\n`)

  for (const lesson of needsImage) {
    const altMatch = lesson.content_mdx.match(/<Image[^>]*alt="([^"]*)"/)
    const altText = altMatch?.[1] || `${lesson.title} diagram`

    console.log(`Processing: ${lesson.slug}`)
    try {
      // Pollinations can be slow — give it up to 30s
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const publicUrl = await generateAndUpload(lesson.slug, altText)
      clearTimeout(timeout)

      const newMdx = lesson.content_mdx.replace(
        /<Image\s+src="[^"]*"([^/]*)\/>/,
        (_, rest) => `<Image src="${publicUrl}"${rest}/>`
      )
      await sb.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)
      console.log(`  ✓ Saved: ${publicUrl.slice(0, 60)}...`)
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
    }

    // Pollinations needs a bit of breathing room between requests
    await sleep(3000)
  }

  console.log('\nAll done!')
}

run()
