import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function searchWikimedia(query) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=8&format=json&origin=*`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()
    const results = searchData.query?.search ?? []
    if (results.length === 0) return null

    for (const result of results) {
      const title = result.title
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`
      const infoRes = await fetch(infoUrl)
      const infoData = await infoRes.json()
      const pages = Object.values(infoData.query?.pages ?? {})
      const imageinfo = pages[0]?.imageinfo?.[0]
      if (!imageinfo?.url) continue
      return imageinfo.url
    }
    return null
  } catch {
    return null
  }
}

// Short keyword queries work better than long descriptive ones on Wikimedia
function lessonQuery(lesson) {
  const map = {
    'variables-loops-functions':   'Python programming loops',
    'lists-and-dictionaries':      'Python data structures',
    'what-is-ros2':                'ROS robot operating system',
    'first-ros2-node':             'ROS node graph',
    'launch-files-parameters':     'ROS launch file',
    'intro-gazebo-rviz':           'Gazebo robot simulation',
    'understanding-urdf':          'URDF robot model',
    'motion-planning-moveit2':     'robot motion planning',
    'forces-torque-load':          'torque force diagram',
    'joints-degrees-of-freedom':   'robot joint degrees of freedom',
    'material-selection':          'engineering materials comparison',
    'intro-to-fusion360':          'CAD 3D modeling software',
    'modeling-a-robot-link':       'robot arm CAD model',
    'assemblies-and-constraints':  'mechanical assembly constraints',
    'gears-belts-screws':          'gear belt mechanical transmission',
    'servo-stepper-dc-motors':     'servo stepper DC motor comparison',
    'designing-a-gripper':         'robot gripper end effector',
    'voltage-current-resistance':  'Ohm law voltage current resistance',
    'reading-schematics':          'circuit schematic diagram',
    'power-systems':               'LiPo battery power electronics',
    'arduino-vs-pi-vs-esp32':      'Arduino Raspberry Pi microcontroller',
    'gpio-pwm-serial':             'PWM signal waveform',
    'flashing-firmware-debugging': 'microcontroller firmware debugging',
    'imu-encoders-distance':       'IMU accelerometer gyroscope sensor',
    'motor-drivers-hbridges':      'H-bridge motor driver circuit',
    'sensor-fusion-basics':        'sensor fusion Kalman filter',
    'why-python-for-robotics':     'Python robotics programming',
  }
  return map[lesson.slug] ?? `${lesson.title} diagram`
}

function replacePlaceholderImages(mdx, imageUrl) {
  // Only replace the first PLACEHOLDER image (one per lesson is enough)
  let replaced = false
  return mdx.replace(
    /<Image\s+src="([^"]*)"(\s+alt="([^"]*)")?[^/]*\/>/g,
    (match, src, _, alt) => {
      if (replaced) return match
      if (src && src !== 'PLACEHOLDER' && src.startsWith('http')) return match
      replaced = true
      return `<Image src="${imageUrl}" alt="${alt ?? ''}" />`
    }
  )
}

async function run() {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, slug, title, content_mdx')

  if (error) { console.error(error); process.exit(1) }

  const needsImage = lessons.filter(l => {
    if (!l.content_mdx) return false
    const match = l.content_mdx.match(/<Image\s+src="([^"]*)"/)
    if (!match) return false
    const src = match[1]
    return !src || src === 'PLACEHOLDER' || !src.startsWith('http')
  })

  console.log(`\n${needsImage.length} lessons need a real image.\n`)

  for (const lesson of needsImage) {
    const query = lessonQuery(lesson)
    console.log(`Searching: "${query}"...`)

    const url = await searchWikimedia(query)
    if (!url) {
      console.log(`  No image found, trying title fallback...`)
      const fallbackUrl = await searchWikimedia(lesson.title)
      if (!fallbackUrl) { console.log(`  Skipping.`); continue }

      const updatedMdx = replacePlaceholderImages(lesson.content_mdx, fallbackUrl)
      await supabase.from('lessons').update({ content_mdx: updatedMdx }).eq('id', lesson.id)
      console.log(`  Saved with fallback: ${lesson.slug}`)
      await new Promise(r => setTimeout(r, 500))
      continue
    }

    console.log(`  Found: ${url.slice(0, 80)}...`)
    const updatedMdx = replacePlaceholderImages(lesson.content_mdx, url)
    const { error: updateError } = await supabase
      .from('lessons').update({ content_mdx: updatedMdx }).eq('id', lesson.id)

    if (updateError) console.error(`  Error: ${updateError.message}`)
    else console.log(`  Saved: ${lesson.slug}`)

    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\nAll done!')
}

run()
