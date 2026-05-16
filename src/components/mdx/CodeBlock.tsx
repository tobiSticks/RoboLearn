'use client'
import { useState } from 'react'
import { Play, Loader2, Terminal, Copy, Check } from 'lucide-react'

type Props = { code: string; language: string }

export default function CodeBlock({ code, language }: Props) {
  const [output, setOutput]   = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [copied, setCopied]   = useState(false)
  const isPython = language === 'python'

  async function run() {
    setRunning(true)
    setOutput(null)
    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10',
          files: [{ content: code }],
        }),
      })
      const data = await res.json()
      const out = data.run?.stdout || data.run?.stderr || data.message || 'No output'
      setOutput(out)
    } catch {
      setOutput('Error: Could not connect to the code runner.')
    }
    setRunning(false)
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
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Running</>
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
