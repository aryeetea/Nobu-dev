import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY ?? process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing ElevenLabs API key' }, { status: 500 })
  }

  const { voiceId, text } = await request.json() as {
    voiceId?: string
    text?: string
  }

  if (!voiceId) {
    return NextResponse.json({ error: 'Missing voiceId' }, { status: 400 })
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    body: JSON.stringify({
      model_id: 'eleven_multilingual_v2',
      text: text || 'Hey, I am Nobu. I am here with you.',
      voice_settings: {
        similarity_boost: 0.82,
        stability: 0.72,
        speed: 0.94,
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    method: 'POST',
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Voice preview failed' }, { status: response.status })
  }

  return new Response(response.body, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': response.headers.get('Content-Type') ?? 'audio/mpeg',
    },
  })
}
