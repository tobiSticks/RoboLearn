import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const BUCKET = 'lesson-images'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const targets = {
  'designing-a-gripper':    'Robotic_arm',
  'motor-drivers-hbridges': 'Electric_motor',
  'first-ros2-node':        'Robotics',
}
const { data: lessons } = await sb.from('lessons').select('id,slug,content_mdx')
for (const [slug, article] of Object.entries(targets)) {
  const lesson = lessons.find(l => l.slug === slug)
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${article}`, { headers: { 'User-Agent': 'RoboLearn/1.0' } })
  const data = await res.json()
  const url = data.thumbnail?.source
  if (!url) { console.log(`${slug}: no thumbnail`); continue }
  const img = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' } })
  if (!img.ok) { console.log(`${slug}: fetch failed ${img.status}`); continue }
  const buf = await img.arrayBuffer()
  const ct = img.headers.get('content-type') ?? 'image/jpeg'
  const ext = ct.includes('gif') ? 'gif' : ct.includes('png') ? 'png' : ct.includes('svg') ? 'svg' : 'jpg'
  await sb.storage.from(BUCKET).upload(`${slug}.${ext}`, buf, { contentType: ct, upsert: true })
  const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(`${slug}.${ext}`)
  const newMdx = lesson.content_mdx.replace(/<Image\s+src="([^"]*)"([^/]*)\/>/,  (_, __, rest) => `<Image src="${publicUrl}"${rest}/>`)
  await sb.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)
  console.log(`${slug}: ✓ saved`)
  await sleep(2000)
}
console.log('Done!')
