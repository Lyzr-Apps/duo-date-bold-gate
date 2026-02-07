import { NextRequest, NextResponse } from 'next/server';
import { mockPrisma as prisma } from '@/lib/mockDb';
import { callAIAgent } from '@/lib/aiAgent';

const DAILY_MATCH_AGENT_ID = process.env.DAILY_MATCH_AGENT_ID || '6987820187eeda742a24acd1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user profile
    const currentUser = await prisma.userProfile.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a match for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingMatch = await prisma.match.findFirst({
      where: {
        userId: userId,
        createdAt: {
          gte: today,
        },
      },
      include: {
        matchedUser: true,
      },
    });

    if (existingMatch) {
      return NextResponse.json({
        success: true,
        match: existingMatch,
        isNew: false,
      });
    }

    // Get potential matches (exclude already matched users)
    const previousMatchIds = await prisma.match.findMany({
      where: { userId },
      select: { matchedUserId: true },
    });

    const excludedIds = [userId, ...previousMatchIds.map(m => m.matchedUserId)];

    const potentialMatches = await prisma.userProfile.findMany({
      where: {
        id: { notIn: excludedIds },
        onboardingComplete: true,
        age: {
          gte: currentUser.preferredAgeMin,
          lte: currentUser.preferredAgeMax,
        },
      },
      take: 20, // Get a pool of potential matches
    });

    if (potentialMatches.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No potential matches available',
      });
    }

    // Prepare data for Daily Match Agent
    const agentInput = JSON.stringify({
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        age: currentUser.age,
        gender: currentUser.gender,
        location: currentUser.location,
        interests: currentUser.interests,
        lookingFor: currentUser.lookingFor,
        dealBreakers: currentUser.dealBreakers,
        idealDateType: currentUser.idealDateType,
        preferredGender: currentUser.preferredGender,
        preferredAgeMin: currentUser.preferredAgeMin,
        preferredAgeMax: currentUser.preferredAgeMax,
      },
      potentialMatches: potentialMatches.map(p => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        location: p.location,
        occupation: p.occupation,
        bio: p.bio,
        interests: p.interests,
        lookingFor: p.lookingFor,
        idealDateType: p.idealDateType,
      })),
    });

    // Call Daily Match Agent with correct parameter order: (message, agent_id, options)
    const agentResponse = await callAIAgent(agentInput, DAILY_MATCH_AGENT_ID, { user_id: userId });

    // Check if the agent call was successful
    if (!agentResponse.success) {
      console.error('Match agent call failed:', agentResponse.error);
      return NextResponse.json(
        { error: agentResponse.error || 'Failed to get match from agent' },
        { status: 500 }
      );
    }

    // Extract the actual response from the normalized structure
    const matchData = agentResponse.response?.result || agentResponse.response;

    if (matchData.status === 'no_matches') {
      return NextResponse.json({
        success: false,
        message: matchData.message,
      });
    }

    // Create match in database
    const newMatch = await prisma.match.create({
      data: {
        userId: userId,
        matchedUserId: matchData.dailyMatch.matchedUserId,
        status: 'pending',
        compatibilityScore: matchData.dailyMatch.compatibilityScore,
        matchReason: matchData.dailyMatch.matchReason,
      },
      include: {
        matchedUser: true,
      },
    });

    // Update user's last match date
    await prisma.userProfile.update({
      where: { id: userId },
      data: {
        lastMatchDate: new Date(),
        matchesShownToday: 1,
      },
    });

    return NextResponse.json({
      success: true,
      match: newMatch,
      matchDetails: matchData.dailyMatch,
      isNew: true,
    });

  } catch (error) {
    console.error('Daily match error:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily match' },
      { status: 500 }
    );
  }
}
