'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bot, Send, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = { role: 'user' | 'assistant'; content: string }

export default function TutorPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase  = createClient()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    async function createSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('chat_sessions').insert({ user_id: user.id }).select().single()
      if (data) setSessionId(data.id)
    }
    createSession()
  }, [])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Save user message
    if (sessionId) {
      await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'user', content: input })
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, sessionId }),
    })

    const reader   = res.body!.getReader()
    const decoder  = new TextDecoder()
    let aiContent  = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const { text } = JSON.parse(line.slice(6))
            aiContent += text
            setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: aiContent }])
          } catch {}
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-8 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">AI Robotics Tutor</h1>
          <p className="text-xs text-gray-500">Ask anything about robotics</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <Bot className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your robotics tutor is ready</h2>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">Ask me anything — from "what is a servo motor?" to "explain PID control loops"</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {['What is ROS 2?', 'How does a stepper motor work?', 'Explain sensor fusion', 'What is a PID controller?'].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={cn(
              'max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
            )}>
              {msg.content
                ? msg.role === 'assistant'
                  ? <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        code: ({ className, children }) =>
                          className
                            ? <code className="block bg-gray-900 text-gray-100 rounded-lg p-3 my-2 text-xs overflow-x-auto whitespace-pre font-mono">{children}</code>
                            : <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({ children }) => <>{children}</>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-3 italic text-gray-600 my-2">{children}</blockquote>,
                      }}
                    >{msg.content}</ReactMarkdown>
                  : msg.content
                : <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              }
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white px-8 py-4">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about robotics..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            disabled={loading} />
          <button type="submit" disabled={loading || !input.trim()}
            className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40">
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>
      </div>
    </div>
  )
}