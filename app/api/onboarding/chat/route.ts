import { NextRequest, NextResponse } from 'next/server';
import { callAIAgent } from '@/lib/aiAgent';

const PROFILE_BUILDER_AGENT_ID = process.env.PROFILE_BUILDER_AGENT_ID || '698781e787eeda742a24accd';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call the Profile Builder Agent with correct parameter order: (message, agent_id, options)
    const agentResponse = await callAIAgent(message, PROFILE_BUILDER_AGENT_ID, { session_id: sessionId });

    // Check if the agent call was successful
    if (!agentResponse.success) {
      console.error('Agent call failed:', agentResponse.error);
      return NextResponse.json(
        { error: agentResponse.error || 'Failed to get response from agent' },
        { status: 500 }
      );
    }

    // Extract the actual response from the normalized structure
    const responseData = agentResponse.response?.result || agentResponse.response;

    return NextResponse.json({
      success: true,
      response: responseData
    });

  } catch (error) {
    console.error('Onboarding chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process onboarding chat' },
      { status: 500 }
    );
  }
}
