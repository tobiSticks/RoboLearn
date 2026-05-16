import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Curated Wikimedia Commons images for each lesson
const IMAGES = {
  'gears-belts-screws':          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Rack_and_pinion_animation.gif/300px-Rack_and_pinion_animation.gif',
  'servo-stepper-dc-motors':     'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Animated_3phase_RL_circuit.gif/300px-Animated_3phase_RL_circuit.gif',
  'designing-a-gripper':         'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/KUKA_robot_for_arc_welding.jpg/320px-KUKA_robot_for_arc_welding.jpg',
  'voltage-current-resistance':  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Ohm%27s_Law_with_Voltage_source_TeX.svg/480px-Ohm%27s_Law_with_Voltage_source_TeX.svg.png',
  'reading-schematics':          'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Ohm%27s_law_voltage_source.svg/480px-Ohm%27s_law_voltage_source.svg.png',
  'power-systems':               'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lipo_pack.jpg/320px-Lipo_pack.jpg',
  'arduino-vs-pi-vs-esp32':      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Arduino_Uno_-_R3.jpg/320px-Arduino_Uno_-_R3.jpg',
  'gpio-pwm-serial':             'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/PWM%2C_3-level.svg/480px-PWM%2C_3-level.svg.png',
  'flashing-firmware-debugging': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Arduino_IDE_-_Blink.png/320px-Arduino_IDE_-_Blink.png',
  'imu-encoders-distance':       'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Mems-gyroscope.jpg/320px-Mems-gyroscope.jpg',
  'motor-drivers-hbridges':      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/H_bridge.svg/480px-H_bridge.svg.png',
  'why-python-for-robotics':     'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/480px-Python-logo-notext.svg.png',
  'lists-and-dictionaries':      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Hash_table_3_1_1_0_1_0_0_SP.svg/480px-Hash_table_3_1_1_0_1_0_0_SP.svg.png',
  'what-is-ros2':                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Ros_logo.svg/480px-Ros_logo.svg.png',
  'first-ros2-node':             'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat_03.jpg/240px-Cat_03.jpg',
  'sensor-fusion-basics':        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Basic_concept_of_Kalman_filtering.svg/480px-Basic_concept_of_Kalman_filtering.svg.png',
}

function hasRealImage(mdx) {
  const match = mdx?.match(/<Image\s+src="([^"]*)"/)
  if (!match) return true // no Image tag at all, skip
  const src = match[1]
  return src && src !== 'PLACEHOLDER' && src.startsWith('http')
}

function replaceImage(mdx, url) {
  let replaced = false
  return mdx.replace(
    /<Image\s+src="([^"]*)"(\s+alt="([^"]*)")?[^/]*\/>/g,
    (match, src, _, alt) => {
      if (replaced) return match
      replaced = true
      return `<Image src="${url}" alt="${alt ?? ''}" />`
    }
  )
}

async function run() {
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, slug, title, content_mdx')

  let updated = 0
  for (const lesson of lessons) {
    const imageUrl = IMAGES[lesson.slug]
    if (!imageUrl) continue
    if (hasRealImage(lesson.content_mdx)) {
      console.log(`Already has image: ${lesson.slug}`)
      continue
    }

    const updatedMdx = replaceImage(lesson.content_mdx, imageUrl)
    const { error } = await supabase
      .from('lessons').update({ content_mdx: updatedMdx }).eq('id', lesson.id)

    if (error) console.error(`  Error: ${lesson.slug}:`, error.message)
    else { console.log(`  Saved: ${lesson.slug}`); updated++ }
  }

  console.log(`\nDone! Updated ${updated} lessons.`)
}

run()
