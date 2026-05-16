import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'lesson-images'

async function fetchImageBuffer(url) {
  // Use a browser User-Agent so Wikimedia serves the image
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://en.wikipedia.org/',
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  return { buffer, contentType }
}

function extractWikimediaUrl(weservUrl) {
  // Convert weserv URL back to original Wikimedia URL
  const match = weservUrl.match(/\?url=(.+)/)
  if (!match) return null
  return 'https://' + match[1]
}

function slugToFilename(slug, ext) {
  return `${slug}.${ext}`
}

function mimeToExt(mime) {
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('svg')) return 'svg'
  if (mime.includes('webp')) return 'webp'
  return 'jpg'
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: true })
    console.log(`Created bucket: ${BUCKET}`)
  }
}

async function run() {
  await ensureBucket()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, slug, content_mdx')

  const toProcess = lessons.filter(l => {
    const m = l.content_mdx?.match(/<Image\s+src="([^"]*)"/)
    return m && m[1].includes('weserv.nl')
  })

  console.log(`\n${toProcess.length} lessons to process.\n`)

  for (const lesson of toProcess) {
    const srcMatch = lesson.content_mdx.match(/<Image\s+src="([^"]*)"/)
    if (!srcMatch) continue

    const weservUrl = srcMatch[1]
    const originalUrl = extractWikimediaUrl(weservUrl)
    if (!originalUrl) continue

    console.log(`Processing: ${lesson.slug}`)
    console.log(`  Source: ${originalUrl.slice(0, 70)}...`)

    try {
      const { buffer, contentType } = await fetchImageBuffer(originalUrl)
      const ext = mimeToExt(contentType)
      const filename = slugToFilename(lesson.slug, ext)

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, { contentType, upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filename)

      const newMdx = lesson.content_mdx.replace(weservUrl, publicUrl)
      await supabase.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)

      console.log(`  Saved to Supabase Storage ✓`)
    } catch (err) {
      console.error(`  Failed: ${err.message}`)
    }

    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\nAll done!')
}

run()
