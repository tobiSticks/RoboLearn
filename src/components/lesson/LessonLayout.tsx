'use client'
import { useState } from 'react'
import { BookOpen, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  content: React.ReactNode
  tutor: React.ReactNode
}

export default function LessonLayout({ content, tutor }: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'tutor'>('content')

  return (
    <>
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-gray-100 bg-white flex-shrink-0">
        {(['content', 'tutor'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            )}>
            {tab === 'content'
              ? <><BookOpen className="w-4 h-4" /> Lesson</>
              : <><Bot className="w-4 h-4" /> AI Tutor</>}
          </button>
        ))}
      </div>

      {/* Desktop: side by side | Mobile: tabs */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn('flex flex-col flex-1 overflow-hidden', activeTab !== 'content' && 'hidden md:flex md:flex-1')}>
          {content}
        </div>
        <div className={cn('flex flex-col overflow-hidden', activeTab !== 'tutor' && 'hidden md:flex md:w-96 md:flex-shrink-0')}>
          {tutor}
        </div>
      </div>
    </>
  )
}
