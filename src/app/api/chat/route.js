import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'

// Inisialisasi Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(req) {
  try {
    const { messages, context, userMessage } = await req.json()

    // Dapatkan respons dari Groq AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Anda adalah asisten AI untuk YR Music yang ramah dan membantu.'
        },
        {
          role: 'user',
          content: `${context}\n\nUser: ${userMessage}`
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.8,
      stream: false
    })

    // Ambil respons dari AI
    const aiResponse = completion.choices[0]?.message?.content || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.'

    // Kembalikan respons
    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('Error in chat route:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
} 