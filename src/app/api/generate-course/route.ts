import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const maxDuration = 60

interface GenerateCourseRequest {
  topic: string
  targetAudience?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  numModules: number
  includeQuiz: boolean
  includeSlides: boolean
}

interface CourseModule {
  title: string
  description: string
  type: 'slide' | 'quiz' | 'assessment'
  content: SlideContent | QuizContent
  duration_minutes: number
}

interface SlideContent {
  slides: Array<{
    title: string
    content: string
  }>
}

interface QuizContent {
  questions: Array<{
    question: string
    type: 'multiple_choice' | 'true_false'
    options?: string[]
    correct_answer: number | boolean
    explanation: string
  }>
}

interface GeneratedCourse {
  title: string
  description: string
  learning_objectives: string[]
  target_audience: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  total_duration_minutes: number
  modules: CourseModule[]
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    const body: GenerateCourseRequest = await request.json()

    if (!body.topic) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: topic' },
        { status: 400 }
      )
    }

    const {
      topic,
      targetAudience = 'ผู้เรียนทั่วไป',
      difficulty = 'beginner',
      duration = 30,
      numModules = 5,
      includeQuiz = true,
      includeSlides = true,
    } = body

    const difficultyThai = {
      beginner: 'เริ่มต้น',
      intermediate: 'ปานกลาง',
      advanced: 'ขั้นสูง',
    }

    const systemPrompt = `คุณเป็นผู้เชี่ยวชาญในการออกแบบหลักสูตรการเรียนรู้ สร้างหลักสูตรที่มีคุณภาพสูง

สร้างหลักสูตรเรื่อง "${topic}" สำหรับ "${targetAudience}"
- ระดับความยาก: ${difficultyThai[difficulty]}
- ระยะเวลารวม: ประมาณ ${duration} นาที
- จำนวนบท: ${numModules} บท
- ${includeSlides ? 'รวมสไลด์' : 'ไม่ต้องมีสไลด์'}
- ${includeQuiz ? 'รวมแบบทดสอบ' : 'ไม่ต้องมีแบบทดสอบ'}

สร้าง JSON ตามโครงสร้างนี้:
{
  "title": "ชื่อหลักสูตร",
  "description": "คำอธิบายหลักสูตร 1-2 ประโยค",
  "learning_objectives": ["วัตถุประสงค์ 1", "วัตถุประสงค์ 2", "วัตถุประสงค์ 3", "วัตถุประสงค์ 4"],
  "target_audience": "${targetAudience}",
  "difficulty_level": "${difficulty}",
  "total_duration_minutes": ${duration},
  "modules": [
    {
      "title": "ชื่อบท",
      "description": "คำอธิบายบท",
      "type": "slide",
      "content": {
        "slides": [
          {"title": "หัวข้อสไลด์", "content": "เนื้อหาสไลด์ 2-3 ประโยค"},
          {"title": "หัวข้อสไลด์ 2", "content": "เนื้อหาสไลด์ 2-3 ประโยค"},
          {"title": "หัวข้อสไลด์ 3", "content": "เนื้อหาสไลด์ 2-3 ประโยค"}
        ]
      },
      "duration_minutes": 5
    },
    {
      "title": "แบบทดสอบ: ชื่อหัวข้อ",
      "description": "ทดสอบความเข้าใจ",
      "type": "quiz",
      "content": {
        "questions": [
          {
            "question": "คำถาม?",
            "type": "multiple_choice",
            "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
            "correct_answer": 0,
            "explanation": "คำอธิบายคำตอบ"
          }
        ]
      },
      "duration_minutes": 3
    }
  ]
}

กฎ:
1. สร้างเนื้อหาเป็นภาษาไทยทั้งหมด
2. สไลด์แต่ละบทควรมี 3-4 สไลด์
3. แบบทดสอบควรมี 2-3 คำถาม
4. สลับระหว่างสไลด์และแบบทดสอบ (ถ้า includeQuiz = true)
5. เพิ่มแบบทดสอบสรุป (type: "assessment") ตอนท้ายถ้า includeQuiz = true
6. เนื้อหาต้องเกี่ยวข้องกับหัวข้อจริงๆ ไม่ใช่ placeholder
7. ตอบเป็น JSON เท่านั้น ไม่มี markdown หรือข้อความอื่น`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://icpg-quiz.netlify.app',
        'X-Title': 'ICPG AI Course Creator',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `สร้างหลักสูตรเรื่อง "${topic}" ตามที่กำหนดไว้` },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter API Error:', response.status, errorData)
      return NextResponse.json(
        { success: false, error: `AI API error: ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content?.trim() || '{}'

    // Extract JSON from response
    let jsonText = responseText
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (match) {
        jsonText = match[1]
      }
    }

    const course: GeneratedCourse = JSON.parse(jsonText)

    // Validate course structure
    if (!course.title || !course.modules || course.modules.length === 0) {
      throw new Error('Invalid course structure from AI')
    }

    return NextResponse.json({
      success: true,
      course,
      message: `สร้างหลักสูตร "${course.title}" สำเร็จ`,
    })

  } catch (error: any) {
    console.error('Generate Course Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate course',
      },
      { status: 500 }
    )
  }
}
