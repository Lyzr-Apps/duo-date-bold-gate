import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, userId, liked } = body;

    if (!matchId || !userId || typeof liked !== 'boolean') {
      return NextResponse.json(
        { error: 'Match ID, user ID, and liked status are required' },
        { status: 400 }
      );
    }

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchedUser: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Determine which user is responding
    const isOriginalUser = match.userId === userId;

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...(isOriginalUser
          ? { userLiked: liked }
          : { matchedUserLiked: liked }),
        status: liked ? 'liked' : 'disliked',
      },
    });

    // Check if it's a mutual match
    const isMutual = updatedMatch.userLiked && updatedMatch.matchedUserLiked;

    if (isMutual) {
      await prisma.match.update({
        where: { id: matchId },
        data: {
          isMutualMatch: true,
          chatUnlockedAt: new Date(),
          status: 'mutual',
        },
      });
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      isMutualMatch: isMutual,
    });

  } catch (error) {
    console.error('Match response error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to match' },
      { status: 500 }
    );
  }
}
