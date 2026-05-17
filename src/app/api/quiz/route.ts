import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.FEATHERLESS_API_KEY,
    baseURL: 'https://api.featherless.ai/v1',
  })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonTitle, lessonDescription, difficulty } = await req.json()

  const prompt = `Generate exactly 4 multiple-choice quiz questions to test understanding of this robotics lesson.

Lesson: "${lessonTitle}"
Description: ${lessonDescription}
Difficulty: ${difficulty}

Return ONLY a valid JSON array with this exact structure, no other text:
[
  {
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- correct is the 0-based index of the right answer
- Make questions practical and concept-testing, not trivial
- Vary difficulty across the 4 questions
- Keep options concise`

  try {
    const response = await client.chat.completions.create({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.choices[0].message.content ?? ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const questions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ questions })
  } catch (err: any) {
    const status = err?.status ?? 500
    const message = status === 429
      ? 'Quiz generation is busy. Wait a moment and try again.'
      : 'Failed to generate quiz. Please try again.'
    return NextResponse.json({ error: message }, { status })
  }
}
