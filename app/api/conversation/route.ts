const defaultAgentId = 'agent_0301knzm0v3efm3th0qnb84gkqrg'
const maxMessageCharacters = 1200
const elevenLabsConversationTimeoutMs = 12000
const nobuBrandPrompt = `
You are Nobu, a personal voice AI assistant.
You help with memory, notes, planning, organization, reflection, shopping, style, and everyday decisions.
You are personal-first, but you can also support school, business, creative work, and team projects when asked.
ScanFit is one of your built-in capabilities, not your whole identity.
When the user asks about fashion, outfits, sizing, shopping, measurements, influencer or creator looks, or body changes, switch into ScanFit support.
In ScanFit support, give honest outfit feedback, smart sizing guidance, look-history suggestions, styling ideas for events or moods, and shopping advice.
Be direct about what works and what does not, but never shame the user's body, identity, budget, or taste.
Do not claim exact body measurements unless the user provides them or a future scan feature supplies them.
You are not a romantic partner, boyfriend, girlfriend, spouse, or dating companion.
If the user has shared a birthday and today is their birthday, wish them happy birthday warmly once.
Use short, natural spoken responses. Ask one simple follow-up when needed.
`

type ElevenLabsAgentEvent = {
  type?: string
  ping_event?: {
    event_id?: number
    ping_ms?: number
  }
  agent_response_event?: {
    agent_response?: string
  }
  text_response_part?: {
    type?: string
    text?: string
  }
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function elevenLabsAgentId() {
  return process.env.ELEVENLABS_AGENT_ID
    ?? process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
    ?? defaultAgentId
}

async function elevenLabsConversationURL() {
  const agentId = elevenLabsAgentId()
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    {
      headers: {
        'xi-api-key': apiKey,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`ElevenLabs signed URL failed: ${response.status}`)
  }

  const data = await response.json()
  const signedURL = typeof data.signed_url === 'string' ? data.signed_url : ''

  if (!signedURL) {
    throw new Error('ElevenLabs signed URL response was empty.')
  }

  return signedURL
}

function sendSocketMessage(socket: WebSocket, message: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

async function requestElevenLabsAgentReply(message: string, userName: string, birthday: string, character: string) {
  const url = await elevenLabsConversationURL()

  return new Promise<string>((resolve, reject) => {
    const socket = new WebSocket(url)
    let settled = false
    let streamingReply = ''

    const settle = (reply?: string, error?: Error) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      socket.close()

      if (error) {
        reject(error)
        return
      }

      resolve(reply?.trim() ?? '')
    }

    const timeout = setTimeout(() => {
      settle(undefined, new Error('ElevenLabs agent timed out.'))
    }, elevenLabsConversationTimeoutMs)

    socket.onopen = () => {
      sendSocketMessage(socket, {
        type: 'conversation_initiation_client_data',
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: nobuBrandPrompt,
            },
          },
        },
        dynamic_variables: {
          birthday,
          user_name: userName,
          nobu_character: character,
        },
      })
      sendSocketMessage(socket, {
        type: 'user_message',
        text: [
          userName ? `My name is ${userName}.` : '',
          birthday ? `My birthday is ${birthday}.` : '',
          message,
        ].filter(Boolean).join(' '),
      })
    }

    socket.onmessage = (event) => {
      let data: ElevenLabsAgentEvent

      try {
        data = JSON.parse(String(event.data)) as ElevenLabsAgentEvent
      } catch {
        return
      }

      if (data.type === 'ping' && data.ping_event?.event_id !== undefined) {
        setTimeout(() => {
          sendSocketMessage(socket, {
            type: 'pong',
            event_id: data.ping_event?.event_id,
          })
        }, data.ping_event.ping_ms ?? 0)
      }

      if (data.type === 'agent_response') {
        settle(data.agent_response_event?.agent_response)
      }

      if (data.type === 'agent_response_correction') {
        settle((data as { agent_response_correction_event?: { corrected_agent_response?: string } })
          .agent_response_correction_event?.corrected_agent_response)
      }

      if (data.type === 'agent_chat_response_part' && data.text_response_part?.text) {
        streamingReply += data.text_response_part.text
        if (data.text_response_part.type === 'stop') {
          settle(streamingReply)
        }
      }
    }

    socket.onerror = () => {
      settle(undefined, new Error('ElevenLabs agent socket failed.'))
    }
  })
}

export async function POST(request: Request) {
  let body: { birthday?: unknown; message?: unknown; userName?: unknown; character?: unknown }

  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid conversation request.', 400)
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const userName = typeof body.userName === 'string' ? body.userName.trim() : ''
  const birthday = typeof body.birthday === 'string' ? body.birthday.trim() : ''
  const character = body.character === 'male' ? 'masculine' : 'feminine'

  if (!message) {
    return jsonError('Conversation message is required.', 400)
  }

  if (message.length > maxMessageCharacters) {
    return jsonError('Conversation message is too long.', 413)
  }

  try {
    const reply = await requestElevenLabsAgentReply(message, userName, birthday, character)
    if (!reply) {
      return jsonError('ElevenLabs agent did not return a reply.', 502)
    }

    return Response.json({ reply })
  } catch (error) {
    console.error(error)
    return jsonError('ElevenLabs agent conversation failed.', 502)
  }
}
