import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'lesson-images'

// Direct (non-thumb) Wikimedia URLs that are known to work
const DIRECT_URLS = {
  'gears-belts-screws':          'https://upload.wikimedia.org/wikipedia/commons/1/19/Rack_and_pinion_animation.gif',
  'servo-stepper-dc-motors':     'https://upload.wikimedia.org/wikipedia/commons/a/a6/Stepper_motor.gif',
  'designing-a-gripper':         'https://upload.wikimedia.org/wikipedia/commons/1/1e/KUKA_robot_for_arc_welding.jpg',
  'voltage-current-resistance':  'https://upload.wikimedia.org/wikipedia/commons/8/84/OhmsLaw.png',
  'reading-schematics':          'https://upload.wikimedia.org/wikipedia/commons/c/cb/Ohms_law_triangle.svg',
  'power-systems':               'https://upload.wikimedia.org/wikipedia/commons/4/4e/Lipo_pack.jpg',
  'arduino-vs-pi-vs-esp32':      'https://upload.wikimedia.org/wikipedia/commons/3/38/Arduino_Uno_-_R3.jpg',
  'gpio-pwm-serial':             'https://upload.wikimedia.org/wikipedia/commons/b/b8/Duty_Cycle_Examples.png',
  'flashing-firmware-debugging': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Arduino_Logo.svg',
  'imu-encoders-distance':       'https://upload.wikimedia.org/wikipedia/commons/c/c4/Mems-gyroscope.jpg',
  'motor-drivers-hbridges':      'https://upload.wikimedia.org/wikipedia/commons/6/6a/H_bridge.svg',
  'why-python-for-robotics':     'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
  'lists-and-dictionaries':      'https://upload.wikimedia.org/wikipedia/commons/7/7d/Hash_table_3_1_1_0_1_0_0_SP.svg',
  'what-is-ros2':                'https://upload.wikimedia.org/wikipedia/commons/b/ba/Ros_logo.svg',
  'first-ros2-node':             'https://upload.wikimedia.org/wikipedia/commons/5/52/ROS_logo.png',
}

const RETRY_SLUGS = [
  'forces-torque-load',
  'joints-degrees-of-freedom',
  'intro-gazebo-rviz',
  'material-selection',
  'intro-to-fusion360',
  'modeling-a-robot-link',
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchImage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://en.wikipedia.org/',
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'image/png'
  return { buffer, contentType }
}

function mimeToExt(mime) {
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('png')) return 'png'
  if (mime.includes('svg')) return 'svg'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  return 'png'
}

async function uploadAndSave(lesson, imageUrl) {
  const { buffer, contentType } = await fetchImage(imageUrl)
  const ext = mimeToExt(contentType)
  const filename = `${lesson.slug}.${ext}`

  await supabase.storage.from(BUCKET).upload(filename, buffer, { contentType, upsert: true })

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

  const newMdx = lesson.content_mdx.replace(
    /<Image\s+src="([^"]*)"([^/]*)\/>/,
    (match, _, rest) => `<Image src="${publicUrl}"${rest}/>`
  )
  await supabase.from('lessons').update({ content_mdx: newMdx }).eq('id', lesson.id)
  return publicUrl
}

async function run() {
  const { data: lessons } = await supabase.from('lessons').select('id, slug, content_mdx')
  const bySlug = Object.fromEntries(lessons.map(l => [l.slug, l]))

  // Fix the /thumb/ URL failures with direct URLs
  console.log('--- Fixing thumb URL failures ---\n')
  for (const [slug, url] of Object.entries(DIRECT_URLS)) {
    const lesson = bySlug[slug]
    if (!lesson) continue
    console.log(`Processing: ${slug}`)
    try {
      const publicUrl = await uploadAndSave(lesson, url)
      console.log(`  ✓ ${publicUrl.slice(0, 60)}...`)
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
    }
    await sleep(800)
  }

  // Retry the rate-limited ones with longer delays
  console.log('\n--- Retrying rate-limited lessons ---\n')
  for (const slug of RETRY_SLUGS) {
    const lesson = bySlug[slug]
    if (!lesson) continue
    const srcMatch = lesson.content_mdx.match(/<Image\s+src="([^"]*)"/)
    if (!srcMatch) continue

    // Extract original URL from weserv wrapper
    const weservUrl = srcMatch[1]
    const originalUrl = weservUrl.includes('weserv.nl')
      ? 'https://' + weservUrl.replace(/.*\?url=/, '')
      : weservUrl

    console.log(`Processing: ${slug}`)
    await sleep(3000) // Wait 3s between each to avoid rate limit
    try {
      const publicUrl = await uploadAndSave(lesson, originalUrl)
      console.log(`  ✓ ${publicUrl.slice(0, 60)}...`)
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
    }
  }

  console.log('\nAll done!')
}

run()
