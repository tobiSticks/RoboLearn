'use client'
import { useEffect, useState } from 'react'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import type { Lesson } from '@/lib/types'
import { BookOpen } from 'lucide-react'

type Props = { lesson: Lesson }

const components = {
  h1: (p: any) => <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4" {...p} />,
  h2: (p: any) => <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-100" {...p} />,
  h3: (p: any) => <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2" {...p} />,
  p:  (p: any) => <p  className="text-gray-700 leading-relaxed mb-4" {...p} />,
  ul: (p: any) => <ul className="list-disc list-inside space-y-1.5 mb-4 text-gray-700" {...p} />,
  ol: (p: any) => <ol className="list-decimal list-inside space-y-1.5 mb-4 text-gray-700" {...p} />,
  li: (p: any) => <li className="leading-relaxed" {...p} />,
  blockquote: (p: any) => (
    <blockquote className="border-l-4 border-blue-300 bg-blue-50 px-4 py-3 rounded-r-lg mb-4 text-blue-800 text-sm italic" {...p} />
  ),
  code: ({ className, children, ...p }: any) => {
    const isBlock = className?.includes('language-')
    return isBlock
      ? <code className={`${className} text-sm font-mono`} {...p}>{children}</code>
      : <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...p}>{children}</code>
  },
  pre: (p: any) => <pre className="bg-gray-900 text-gray-100 rounded-xl p-5 overflow-x-auto mb-6 text-sm leading-relaxed" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-gray-900" {...p} />,
  hr: () => <hr className="border-gray-200 my-8" />,
  a: (p: any) => <a className="text-blue-600 underline hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer" {...p} />,
}

export default function LessonContent({ lesson }: Props) {
  const [mdx, setMdx] = useState<MDXRemoteSerializeResult | null>(null)

  useEffect(() => {
    if (!lesson.content_mdx) { setMdx(null); return }
    serialize(lesson.content_mdx).then(setMdx)
  }, [lesson.content_mdx])

  const hasContent = lesson.content_mdx?.trim().length > 0

  return (
    <article className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-10 py-10">
        {/* Lesson intro */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <p className="text-gray-500 leading-relaxed">{lesson.description}</p>
        </div>

        {/* MDX content */}
        {hasContent && mdx ? (
          <div className="prose-custom">
            <MDXRemote {...mdx} components={components} />
          </div>
        ) : (
          /* Placeholder when content_mdx is empty */
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Content coming soon</p>
                  <p className="text-sm text-blue-700">
                    This lesson is being written. In the meantime, use the AI tutor on the right — ask it to explain <strong>{lesson.title}</strong> and it will teach you everything you need to know.
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-generated outline based on lesson title */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">What you'll learn</h2>
              <div className="space-y-3">
                {[
                  `What ${lesson.title} is and why it matters in robotics`,
                  `Key concepts and terminology`,
                  `A practical example you can apply immediately`,
                  `Common mistakes and how to avoid them`,
                  `Where to go next after this lesson`,
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>Tip:</strong> Try asking the AI tutor: <em>"Teach me about {lesson.title} as if I'm a complete beginner"</em>
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}