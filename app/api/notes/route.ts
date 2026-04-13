import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: fetch all notes for a user (by userId query param)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  const notes = await prisma.note.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(notes)
}

// POST: create a new note
export async function POST(req: NextRequest) {
  const { userId, content, conversationId } = (await req.json()) as {
    userId?: string
    content?: string
    conversationId?: string
  }
  if (!userId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const note = await prisma.note.create({
    data: {
      userId,
      content,
      ...(conversationId ? { sessionId: conversationId } : {}),
    },
  })
  return NextResponse.json(note)
}
