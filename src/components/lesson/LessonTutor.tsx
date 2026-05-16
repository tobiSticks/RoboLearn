'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bot, Send, Loader2, User, ChevronDown, ChevronUp, Lightbulb,ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lesson } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'Explain this lesson to me like a beginner',
  'Give me a real-world example',
  'What are common mistakes?',
  'Quiz me on this topic',
]

export default function LessonTutor({ lesson, userId }: { lesson: Lesson; userId: string }) {
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [sessionId, setSessionId]   = useState<string | null>(null)
  const [collapsed, setCollapsed]   = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const supabase   = createClient()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    async function initSession() {
      const { data } = await supabase
        .from('chat_sessions')
        .insert({ user_id: userId, lesson_id: lesson.id, title: lesson.title })
        .select().single()
      if (data) setSessionId(data.id)
    }
    initSession()
  }, [lesson.id])

  async function send(text?: string) {
    const content = text ?? input
    if (!content.trim() || loading) return

    const userMsg: Message = { role: 'user', content }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    if (sessionId) {
      await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'user', content })
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages:      history,
        sessionId,
        lessonContext: { title: lesson.title, description: lesson.description, difficulty: lesson.difficulty },
      }),
    })

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Something went wrong. Please try again.' }))
      setMessages(prev => [...prev, { role: 'assistant', content: error }])
      setLoading(false)
      return
    }

    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let ai = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            ai += JSON.parse(line.slice(6)).text
            setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: ai }])
          } catch {}
        }
      }
    }
    setLoading(false)
  }

  return (
    <aside className={cn(
      'flex flex-col border-l border-gray-100 bg-gray-50 transition-all duration-200 flex-shrink-0',
      collapsed ? 'w-12' : 'w-96'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">AI Tutor</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          title={collapsed ? 'Expand tutor' : 'Collapse tutor'}>
          {collapsed
            ? <ChevronLeft className="w-4 h-4 text-gray-500" />
            : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-white rounded-xl p-3 border border-gray-100">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    I'm your tutor for <strong>{lesson.title}</strong>. Ask me anything about this lesson or robotics in general.
                  </p>
                </div>
                <p className="text-xs text-gray-400 font-medium px-1">Quick questions</p>
                {STARTERS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors leading-relaxed">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' && 'justify-end')}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                )}>
                  {msg.content
                    ? msg.role === 'assistant'
                      ? <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-3 mb-1.5 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-3 mb-1.5 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            h3: ({ children }) => <h3 className="font-semibold mt-2 mb-1">{children}</h3>,
                            h4: ({ children }) => <h4 className="font-semibold mt-1.5 mb-0.5">{children}</h4>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            code: ({ className, children }) =>
                              className
                                ? <code className="block bg-gray-900 text-gray-100 rounded p-2 my-1.5 text-[10px] overflow-x-auto whitespace-pre font-mono">{children}</code>
                                : <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded font-mono">{children}</code>,
                            pre: ({ children }) => <>{children}</>,
                          }}
                        >{msg.content}</ReactMarkdown>
                      : msg.content
                    : <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  }
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-gray-500" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                disabled={loading}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 flex-shrink-0">
                {loading
                  ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                  : <Send className="w-3 h-3 text-white" />}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}