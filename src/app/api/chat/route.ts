import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.FEATHERLESS_API_KEY,
  baseURL: 'https://api.featherless.ai/v1',
})

export async function POST(req: NextRequest) {
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

  const stream = await client.chat.completions.create({
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    max_tokens: 1024,
    stream: true,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          fullResponse += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()

      if (sessionId) {
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
