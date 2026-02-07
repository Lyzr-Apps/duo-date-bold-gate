import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET messages for a match
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Verify match exists and is mutual
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || !match.isMutualMatch) {
      return NextResponse.json(
        { error: 'Chat not available for this match' },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            photos: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, senderId, receiverId, content } = body;

    if (!matchId || !senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify match exists and is mutual
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || !match.isMutualMatch) {
      return NextResponse.json(
        { error: 'Chat not available for this match' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        matchId,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            photos: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
