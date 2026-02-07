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

    // Call the Profile Builder Agent
    const agentResponse = await callAIAgent(PROFILE_BUILDER_AGENT_ID, message, sessionId);

    // Parse the agent response
    let parsedResponse;
    try {
      parsedResponse = typeof agentResponse === 'string'
        ? JSON.parse(agentResponse)
        : agentResponse;
    } catch (parseError) {
      console.error('Failed to parse agent response:', parseError);
      return NextResponse.json(
        { error: 'Invalid agent response format' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: parsedResponse
    });

  } catch (error) {
    console.error('Onboarding chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process onboarding chat' },
      { status: 500 }
    );
  }
}
