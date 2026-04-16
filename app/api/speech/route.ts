const NOBU_VOICE_IDS = {
  female: 'eXpIbVcVbLo8ZJQDlDnl',
  male: '5kMbtRSEKIkRZSdXxrZg',
} as const

type NobuSpeechCharacter = keyof typeof NOBU_VOICE_IDS

const maxSpeechCharacters = 700

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function parseCharacter(value: unknown): NobuSpeechCharacter {
  return value === 'male' ? 'male' : 'female'
}

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return jsonError('ElevenLabs speech is not configured.', 501)
  }

  let body: { text?: unknown; character?: unknown }

  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid speech request.', 400)
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''

  if (!text) {
    return jsonError('Speech text is required.', 400)
  }

  if (text.length > maxSpeechCharacters) {
    return jsonError('Speech text is too long.', 413)
  }

  const character = parseCharacter(body.character)
  const voiceId = NOBU_VOICE_IDS[character]
  const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.34,
        similarity_boost: 0.86,
        style: 0.44,
        use_speaker_boost: true,
      },
    }),
  })

  if (!elevenLabsResponse.ok) {
    return jsonError('Nobu speech failed.', 502)
  }

  const audio = await elevenLabsResponse.arrayBuffer()

  return new Response(audio, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'audio/mpeg',
    },
  })
}
