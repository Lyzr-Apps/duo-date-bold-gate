import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, profileData } = body;

    if (!email || !profileData) {
      return NextResponse.json(
        { error: 'Email and profile data are required' },
        { status: 400 }
      );
    }

    // Create or update user profile
    const userProfile = await prisma.userProfile.upsert({
      where: { email },
      update: {
        name: profileData.name,
        age: profileData.age,
        gender: profileData.gender,
        location: profileData.location,
        occupation: profileData.occupation || null,
        bio: profileData.bio || null,
        interests: profileData.interests || [],
        lookingFor: profileData.lookingFor || '',
        dealBreakers: profileData.dealBreakers || [],
        idealDateType: profileData.idealDateType || [],
        preferredGender: profileData.preferredGender || [],
        preferredAgeMin: profileData.preferredAgeMin || 18,
        preferredAgeMax: profileData.preferredAgeMax || 99,
        onboardingComplete: true,
        updatedAt: new Date(),
      },
      create: {
        email,
        name: profileData.name,
        age: profileData.age,
        gender: profileData.gender,
        location: profileData.location,
        occupation: profileData.occupation || null,
        bio: profileData.bio || null,
        interests: profileData.interests || [],
        lookingFor: profileData.lookingFor || '',
        dealBreakers: profileData.dealBreakers || [],
        idealDateType: profileData.idealDateType || [],
        photos: [],
        preferredGender: profileData.preferredGender || [],
        preferredAgeMin: profileData.preferredAgeMin || 18,
        preferredAgeMax: profileData.preferredAgeMax || 99,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: userProfile,
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
