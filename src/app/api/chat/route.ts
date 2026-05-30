import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, lessonContext, sessionId } = await req.json()

  const systemPrompt = `You are an expert robotics tutor for RoboLearn, an online learning platform. Your role is to help students understand robotics concepts clearly and practically.

${lessonContext ? `The student is currently studying: "${lessonContext.title}"\nLesson description: ${lessonContext.description}\nDifficulty level: ${lessonContext.difficulty}` : 'The student is asking a general robotics question.'}

Guidelines:
- Explain concepts at the appropriate level (${lessonContext?.difficulty ?? 'beginner'})
- Use practical, real-world robotics examples
- Break down complex ideas into simple steps
- When relevant, suggest code examples in Python or relevant tools
- Be encouraging and patient
- If a concept relates to the current lesson, tie your explanation back to it
- Keep answers focused and not too long — offer to go deeper if they want`

  let stream
  try {
    stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })
  } catch (err: any) {
    const status = err?.status ?? 500
    const message =
      status === 429 ? 'The AI tutor is busy right now — you\'ve hit the rate limit. Wait a moment and try again.'
      : status === 401 ? 'Invalid API key. Please check your GROQ_API_KEY in Vercel environment variables.'
      : 'The AI tutor is unavailable right now. Please try again.'
    return NextResponse.json({ error: message }, { status })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullResponse += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n_Connection interrupted. Please try again._' })}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()

      if (sessionId && fullResponse) {
        await supabase.from('chat_messages').insert([
          { session_id: sessionId, role: 'assistant', content: fullResponse }
        ])
      }
    }
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  })
}
