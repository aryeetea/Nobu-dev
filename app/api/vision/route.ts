type VisionKind = 'outfit' | 'room' | 'note' | 'object'

const allowedKinds = new Set<VisionKind>(['outfit', 'room', 'note', 'object'])
const maxImageBytes = 4 * 1024 * 1024

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''

  if (!contentType.includes('multipart/form-data')) {
    return jsonResponse(
      {
        error: 'Nobu vision expects multipart/form-data with image, kind, and optional prompt.',
      },
      415
    )
  }

  const formData = await request.formData()
  const image = formData.get('image')
  const kind = formData.get('kind')
  const prompt = formData.get('prompt')

  if (!(image instanceof File)) {
    return jsonResponse({ error: 'Missing image file.' }, 400)
  }

  if (typeof kind !== 'string' || !allowedKinds.has(kind as VisionKind)) {
    return jsonResponse({ error: 'Invalid vision kind.' }, 400)
  }

  if (image.size > maxImageBytes) {
    return jsonResponse({ error: 'Image is too large. Resize it before analysis.' }, 413)
  }

  return jsonResponse(
    {
      configured: false,
      emotion: kind === 'outfit' ? 'fashion' : 'thinking',
      motionGroup: null,
      motionIndex: null,
      reply:
        'Camera upload is wired, but AI vision is not connected yet. Add the server-side vision provider before releasing this feature.',
      summary: `Received ${kind} image${typeof prompt === 'string' && prompt.trim() ? ` with prompt: ${prompt.trim()}` : ''}.`,
    },
    501
  )
}

