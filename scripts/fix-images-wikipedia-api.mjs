import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'lesson-images'
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Wikipedia article titles to look up thumbnails for each lesson
const WIKI_ARTICLES = {
  'gears-belts-screws':          'Gear',
  'servo-stepper-dc-motors':     'Stepper_motor',
  'designing-a-gripper':         'Robot_end_effector',
  'voltage-current-resistance':  "Ohm%27s_law",
  'reading-schematics':          'Circuit_diagram',
  'power-systems':               'Lithium_polymer_battery',
  'arduino-vs-pi-vs-esp32':      'Arduino',
  'gpio-pwm-serial':             'Pulse-width_modulation',
  'flashing-firmware-debugging': 'Firmware',
  'imu-encoders-distance':       'Inertial_measurement_unit',
  'motor-drivers-hbridges':      'H-bridge',
  'why-python-for-robotics':     'Python_(programming_language)',
  'lists-and-dictionaries':      'Hash_table',
  'what-is-ros2':                'Robot_Operating_System',
  'first-ros2-node':             'Robot_Operating_System',
  'forces-torque-load':          'Torque',
  'joints-degrees-of-freedom':   'Degrees_of_freedom_(mechanics)',
  'intro-gazebo-rviz':           'Robot_simulation',
  'material-selection':          'Engineering_materials',
  'intro-to-fusion360':          'Computer-aided_design',
  'modeling-a-robot-link':       'Robotic_arm',
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

  // Only process lessons that still have weserv URLs (not yet saved to Supabase)
  const toFix = lessons.filter(l => {
    const m = l.content_mdx?.match(/<Image\s+src="([^"]*)"/)
    return m && (m[1].includes('weserv.nl') || !m[1].includes('supabase'))
  })

  console.log(`${toFix.length} lessons still need images.\n`)

  for (const lesson of toFix) {
    const article = WIKI_ARTICLES[lesson.slug]
    if (!article) { console.log(`No article mapping for: ${lesson.slug}`); continue }

    console.log(`Processing: ${lesson.slug} → Wikipedia:${article}`)

    const thumbUrl = await getWikipediaThumbnail(article)
    if (!thumbUrl) { console.log(`  No thumbnail found`); continue }

    console.log(`  Thumbnail: ${thumbUrl.slice(0, 70)}...`)

    try {
      const { buffer, contentType } = await fetchImage(thumbUrl)
      const ext = mimeToExt(contentType)
      const filename = `${lesson.slug}.${ext}`

      await supabase.storage.from(BUCKET).upload(filename, buffer, { contentType, upsert: true })
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

      const newMdx = lesson.content_mdx.replace(
        /<Image\s+src="([^"]*)"([^/]*)\/>/,
        (_, __, rest) => `<Image src="${publicUrl}"${rest}/>`
      )
      await supabase.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)
      console.log(`  ✓ Saved to Supabase Storage`)
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
    }

    await sleep(1500)
  }

  console.log('\nAll done!')
}

run()
