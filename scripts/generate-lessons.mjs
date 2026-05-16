import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const client   = new OpenAI({ apiKey: process.env.FEATHERLESS_API_KEY, baseURL: 'https://api.featherless.ai/v1' })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const lessons = [
  // Software track
  { slug: 'why-python-for-robotics',     title: 'Why Python for robotics?',            description: 'How Python fits into the robotics stack, key libraries overview' },
  { slug: 'variables-loops-functions',   title: 'Variables, loops & functions',        description: 'Core programming concepts with robotics-themed examples' },
  { slug: 'lists-and-dictionaries',      title: 'Working with lists & dictionaries',   description: 'Storing sensor data, mapping joint states, handling robot configurations' },
  { slug: 'what-is-ros2',               title: 'What is ROS 2 and why it matters',    description: 'Architecture overview, nodes, topics, and how ROS 2 differs from ROS 1' },
  { slug: 'first-ros2-node',            title: 'Your first ROS 2 node',               description: 'Setting up workspace, writing a publisher and subscriber in Python' },
  { slug: 'launch-files-parameters',    title: 'Launch files & parameters',           description: 'Running multiple nodes, passing config values, organizing a ROS 2 project' },
  { slug: 'intro-gazebo-rviz',          title: 'Intro to Gazebo & RViz',              description: 'Simulating a robot world, visualizing sensor data and robot state' },
  { slug: 'understanding-urdf',         title: 'Understanding URDF',                  description: 'Describing robot geometry and joints in XML — the universal robot format' },
  { slug: 'motion-planning-moveit2',    title: 'Basic motion planning with MoveIt 2', description: 'Planning collision-free paths, using move group interface, executing trajectories' },
  // Mechanical track
  { slug: 'forces-torque-load',         title: 'Forces, torque & load analysis',      description: 'Understanding why robots fail structurally and how to design so they don\'t' },
  { slug: 'joints-degrees-of-freedom',  title: 'Joints and degrees of freedom',       description: 'Revolute, prismatic, and spherical joints — how motion is constrained' },
  { slug: 'material-selection',         title: 'Material selection for robotics',      description: 'Aluminum vs steel vs carbon fiber vs 3D printed plastic — tradeoffs' },
  { slug: 'intro-to-fusion360',         title: 'Intro to Fusion 360 / FreeCAD',       description: 'Setting up a CAD environment, navigating the interface, basic sketching tools' },
  { slug: 'modeling-a-robot-link',      title: 'Modeling a robot link',               description: 'Designing a structural arm segment — extrusions, holes, fillets, tolerances' },
  { slug: 'assemblies-and-constraints', title: 'Assemblies and constraints',           description: 'Joining parts, defining motion constraints, exporting for 3D printing or CNC' },
  { slug: 'gears-belts-screws',         title: 'Gears, belts & screws',               description: 'Mechanical transmission basics — gear ratios, backlash, belt tension, lead screws' },
  { slug: 'servo-stepper-dc-motors',    title: 'Servo vs stepper vs DC motors',       description: 'Comparing motor types for different robot applications — torque, speed, precision' },
  { slug: 'designing-a-gripper',        title: 'Designing a simple gripper',          description: 'End-effector fundamentals — parallel, angular, and vacuum grippers from scratch' },
  // Electrical track
  { slug: 'voltage-current-resistance', title: 'Voltage, current & resistance',       description: 'The core trio every roboticist must understand — Ohm\'s law with robot examples' },
  { slug: 'reading-schematics',         title: 'Reading circuit schematics',           description: 'Decoding diagrams found in datasheets, motor driver boards, and sensor modules' },
  { slug: 'power-systems',              title: 'Power systems for robots',             description: 'LiPo batteries, voltage regulators, current draw estimation, safe wiring' },
  { slug: 'arduino-vs-pi-vs-esp32',     title: 'Arduino vs Raspberry Pi vs ESP32',    description: 'When to use each platform — real-time control, processing, wireless comms' },
  { slug: 'gpio-pwm-serial',            title: 'GPIO, PWM & serial communication',    description: 'Talking to motors, sensors, and chips with digital and analog signals' },
  { slug: 'flashing-firmware-debugging',title: 'Flashing firmware & debugging',       description: 'Uploading code, serial monitors, oscilloscope traces, common failure modes' },
  { slug: 'imu-encoders-distance',      title: 'IMUs, encoders & distance sensors',   description: 'Measuring acceleration, rotation, position, and distance — sensing fundamentals' },
  { slug: 'motor-drivers-hbridges',     title: 'Motor drivers & H-bridges',           description: 'Controlling DC and stepper motors from a microcontroller — L298N, DRV8833' },
  { slug: 'sensor-fusion-basics',       title: 'Sensor fusion basics',                description: 'Combining IMU + encoder + camera data for reliable robot state estimation' },
]

async function generateLesson(lesson) {
  console.log(`Generating: ${lesson.title}...`)

  const prompt = `Write a complete, high-quality robotics lesson in MDX format.

Lesson title: ${lesson.title}
Lesson description: ${lesson.description}

Requirements:
- Write for a beginner-to-intermediate robotics student
- 600–900 words of actual content (not counting code)
- Use proper MDX with these sections in order:
  1. ## Overview — what this topic is and why it matters in robotics (2-3 paragraphs)
  2. ## Key concepts — explain 3-4 core ideas with clear headings (### for each)
  3. ## Practical example — a working code example (Python where relevant) with explanation
  4. ## Common mistakes — 2-3 things beginners get wrong
  5. ## Summary — 3-5 bullet points of what was covered
  6. ## Further reading — 3 real resources (YouTube channels, official docs, or books) as markdown links

Rules:
- All code blocks must have a language tag e.g. \`\`\`python or \`\`\`bash or \`\`\`xml
- Use > blockquote for important tips or warnings
- Use **bold** for key terms the first time they appear
- Add a YouTube embed placeholder like this where a video would help most:
  <YouTube id="PLACEHOLDER" title="Brief description of what video to search for" />
- Add an image placeholder like this after key diagrams would help:
  <Image src="PLACEHOLDER" alt="Description of what image/diagram to add here" />
- Write in a friendly, direct teaching tone — like a knowledgeable friend explaining something
- Do NOT include frontmatter or the lesson title as H1 (it's already shown by the UI)
- Output ONLY the MDX content, nothing else`

  const response = await client.chat.completions.create({
    model:      'meta-llama/Llama-3.3-70B-Instruct',
    max_tokens: 2000,
    messages:   [{ role: 'user', content: prompt }],
  })

  return response.choices[0].message.content
}

async function run() {
  // Check which lessons already have content
  const { data: existing } = await supabase
    .from('lessons')
    .select('slug, content_mdx')

  const needsContent = existing.filter(l =>
    !l.content_mdx || l.content_mdx.trim().length < 100
  ).map(l => l.slug)

  console.log(`\n${needsContent.length} lessons need content.\n`)

  for (const lesson of lessons) {
    if (!needsContent.includes(lesson.slug)) {
      console.log(`Skipping (already has content): ${lesson.slug}`)
      continue
    }

    try {
      const content = await generateLesson(lesson)

      const { error } = await supabase
        .from('lessons')
        .update({ content_mdx: content, updated_at: new Date().toISOString() })
        .eq('slug', lesson.slug)

      if (error) {
        console.error(`  Error saving ${lesson.slug}:`, error.message)
      } else {
        console.log(`  Saved: ${lesson.slug}`)
      }

      // Pause between API calls to avoid rate limits
      await new Promise(r => setTimeout(r, 1500))

    } catch (err) {
      console.error(`  Failed ${lesson.slug}:`, err.message)
    }
  }

  console.log('\nAll done!')
}

run()