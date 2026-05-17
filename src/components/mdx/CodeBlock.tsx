'use client'
import { useState } from 'react'
import { Play, Loader2, Terminal, Copy, Check, Info } from 'lucide-react'

type Props = { code: string; language: string }

// Pyodide loaded once and reused
let pyodideInstance: any = null
let pyodideLoading: Promise<any> | null = null

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance
  if (pyodideLoading) return pyodideLoading
  pyodideLoading = (async () => {
    await new Promise<void>((resolve, reject) => {
      if (document.getElementById('pyodide-script')) { resolve(); return }
      const s = document.createElement('script')
      s.id  = 'pyodide-script'
      s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js'
      s.onload  = () => resolve()
      s.onerror = () => reject(new Error('Failed to load Pyodide'))
      document.head.appendChild(s)
    })
    pyodideInstance = await (window as any).loadPyodide()
    return pyodideInstance
  })()
  return pyodideLoading
}

// Map imports → friendly explanation of why they can't run in the browser
const BROWSER_BLOCKERS: Record<string, string> = {
  serial:            '📡 This code uses pyserial to communicate with a serial port (e.g. Arduino). It requires a physical device connected to your computer — it can\'t run in a browser.',
  pyserial:          '📡 This code uses pyserial to communicate with a serial port (e.g. Arduino). It requires a physical device connected to your computer — it can\'t run in a browser.',
  'RPi.GPIO':        '🍓 This code uses RPi.GPIO to control Raspberry Pi GPIO pins. It needs to run directly on a Raspberry Pi — not in a browser.',
  rclpy:             '🤖 This code requires ROS 2 to be installed on your computer. ROS 2 is a full robotics framework that runs on Linux — it can\'t run in a browser.',
  'rclpy.node':      '🤖 This code requires ROS 2 to be installed on your computer. ROS 2 is a full robotics framework that runs on Linux — it can\'t run in a browser.',
  'std_msgs.msg':    '🤖 This code uses ROS 2 message types. ROS 2 must be installed on your computer to run this.',
  'geometry_msgs':   '🤖 This code uses ROS 2 geometry messages. ROS 2 must be installed on your computer to run this.',
  'sensor_msgs':     '🤖 This code uses ROS 2 sensor messages. ROS 2 must be installed on your computer to run this.',
  rospy:             '🤖 This code uses rospy (ROS 1). It requires ROS 1 installed on a Linux machine — it can\'t run in a browser.',
  moveit_commander:  '🦾 This code uses MoveIt 2 for robot motion planning. It requires ROS 2 + MoveIt 2 installed on your computer.',
  'gazebo_msgs.msg': '🌍 This code communicates with the Gazebo simulator. It requires ROS 2 + Gazebo installed on your computer.',
  'gazebo_msgs':     '🌍 This code communicates with the Gazebo simulator. It requires ROS 2 + Gazebo installed on your computer.',
  FreeCAD:           '🔧 This code uses FreeCAD, a desktop CAD application. Install FreeCAD on your computer to run this script.',
  openCAD:           '🔧 This code uses OpenSCAD, a desktop CAD application. Install OpenSCAD on your computer to run this script.',
  smbus:             '🔌 This code uses smbus for I2C communication with hardware components. It needs to run on physical hardware (e.g. Raspberry Pi).',
  spidev:            '🔌 This code uses spidev for SPI communication with hardware components. It needs to run on physical hardware.',
}

// Packages Pyodide can load automatically
const PYODIDE_LOADABLE = ['numpy', 'scipy', 'pandas', 'matplotlib']

function getBrowserBlocker(code: string): string | null {
  const imports = [...code.matchAll(/^(?:import|from)\s+([\w.]+)/gm)].map(m => m[1])
  for (const imp of imports) {
    // Check exact match and prefix match (e.g. "rclpy.node" matches "rclpy")
    const msg = BROWSER_BLOCKERS[imp] ?? Object.entries(BROWSER_BLOCKERS).find(([k]) => imp.startsWith(k))?.[1]
    if (msg) return msg
  }
  return null
}

function friendlyError(raw: string): string {
  if (raw.includes('ModuleNotFoundError')) {
    const mod = raw.match(/No module named '([^']+)'/)?.[1]
    return `Module not found: '${mod}'\n\nThis package isn't available in the browser Python environment. If it requires physical hardware or a specific OS, it needs to run on your local machine.`
  }
  // Strip the long pyodide internal traceback lines, keep only the useful part
  const lines = raw.split('\n').filter(l =>
    !l.includes('pyodide') && !l.includes('zip/') && !l.trim().startsWith('at ')
  )
  return lines.join('\n').trim() || raw
}

export default function CodeBlock({ code, language }: Props) {
  const [output, setOutput]   = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isInfo, setIsInfo]   = useState(false)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const isPython = language === 'python'

  async function run() {
    setRunning(true)
    setOutput(null)
    setIsError(false)
    setIsInfo(false)

    // Check for browser-incompatible imports first
    const blocker = getBrowserBlocker(code)
    if (blocker) {
      setOutput(blocker)
      setIsInfo(true)
      setRunning(false)
      return
    }

    try {
      if (!pyodideInstance) {
        setLoading(true)
        await getPyodide()
        setLoading(false)
      }
      const py = pyodideInstance

      // Auto-load any supported packages (numpy, etc.)
      try {
        await py.loadPackagesFromImports(code)
      } catch {}

      let stdout = ''
      py.setStdout({ batched: (s: string) => { stdout += s + '\n' } })
      py.setStderr({ batched: (s: string) => { stdout += s + '\n' } })

      await py.runPythonAsync(code)
      setOutput(stdout.trim() || '(no output)')
    } catch (err: any) {
      setOutput(friendlyError(err.message ?? String(err)))
      setIsError(true)
    }

    setRunning(false)
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const outputColor = isInfo ? 'text-blue-400' : isError ? 'text-red-400' : 'text-green-400'
  const outputBg    = isInfo ? 'bg-blue-950'  : isError ? 'bg-red-950'   : 'bg-gray-950'

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-gray-800">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <div className="flex items-center gap-2">
          <button onClick={copy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {isPython && (
            <button onClick={run} disabled={running}
              className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-2.5 py-1 rounded transition-colors">
              {running
                ? <><Loader2 className="w-3 h-3 animate-spin" /> {loading ? 'Loading Python...' : 'Running'}</>
                : <><Play className="w-3 h-3" /> Run</>}
            </button>
          )}
        </div>
      </div>

      {/* Code */}
      <pre className="bg-gray-900 text-gray-100 px-5 py-4 overflow-x-auto text-sm leading-relaxed m-0 rounded-none">
        <code>{code}</code>
      </pre>

      {/* Output */}
      {output !== null && (
        <div className={`${outputBg} border-t border-gray-800`}>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
            {isInfo
              ? <Info className={`w-3 h-3 ${outputColor}`} />
              : <Terminal className={`w-3 h-3 ${outputColor}`} />}
            <span className={`text-xs font-medium ${outputColor}`}>
              {isInfo ? 'Why this can\'t run in the browser' : isError ? 'Error' : 'Output'}
            </span>
          </div>
          <pre className={`px-4 py-3 text-sm ${isInfo ? 'text-blue-200' : isError ? 'text-red-300' : 'text-gray-300'} font-mono whitespace-pre-wrap overflow-x-auto m-0 leading-relaxed`}>
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}
