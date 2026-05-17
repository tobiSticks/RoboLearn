'use client'
import { useState, useRef } from 'react'
import { Play, Loader2, Terminal, Copy, Check } from 'lucide-react'

type Props = { code: string; language: string }

// Pyodide is loaded once and reused across all code blocks
let pyodideInstance: any = null
let pyodideLoading: Promise<any> | null = null

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance
  if (pyodideLoading) return pyodideLoading

  pyodideLoading = (async () => {
    // Load Pyodide from CDN
    await new Promise<void>((resolve, reject) => {
      if (document.getElementById('pyodide-script')) { resolve(); return }
      const script = document.createElement('script')
      script.id  = 'pyodide-script'
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js'
      script.onload  = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Pyodide'))
      document.head.appendChild(script)
    })
    const py = await (window as any).loadPyodide()
    pyodideInstance = py
    return py
  })()

  return pyodideLoading
}

export default function CodeBlock({ code, language }: Props) {
  const [output, setOutput]   = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const isPython = language === 'python'

  async function run() {
    setRunning(true)
    setOutput(null)

    try {
      if (!pyodideInstance) {
        setLoading(true)
        await getPyodide()
        setLoading(false)
      }

      const py = pyodideInstance

      // Capture stdout
      let stdout = ''
      py.setStdout({ batched: (s: string) => { stdout += s + '\n' } })
      py.setStderr({ batched: (s: string) => { stdout += s + '\n' } })

      await py.runPythonAsync(code)
      setOutput(stdout.trim() || '(no output)')
    } catch (err: any) {
      setOutput(`Error: ${err.message ?? err}`)
    }

    setRunning(false)
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        <div className="bg-gray-950 border-t border-gray-800">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
            <Terminal className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Output</span>
          </div>
          <pre className="px-4 py-3 text-sm text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto m-0">
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}
