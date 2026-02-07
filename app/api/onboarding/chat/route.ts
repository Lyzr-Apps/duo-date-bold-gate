import { NextRequest, NextResponse } from 'next/server';
import parseLLMJson from '@/lib/jsonParser';

const PROFILE_BUILDER_AGENT_ID = process.env.PROFILE_BUILDER_AGENT_ID || '698781e787eeda742a24accd';
const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
const LYZR_API_KEY = process.env.LYZR_API_KEY || '';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

    if (!LYZR_API_KEY) {
      return NextResponse.json(
        { error: 'LYZR_API_KEY not configured' },
        { status: 500 }
      );
    }

    const finalSessionId = sessionId || `${PROFILE_BUILDER_AGENT_ID}-${generateUUID().substring(0, 12)}`;

    const payload = {
      message,
      agent_id: PROFILE_BUILDER_AGENT_ID,
      user_id: `user-${generateUUID()}`,
      session_id: finalSessionId,
    };

    const response = await fetch(LYZR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();

    if (!response.ok) {
      let errorMsg = `API returned status ${response.status}`;
      try {
        const errorData = parseLLMJson(rawText) || JSON.parse(rawText);
        errorMsg = errorData?.error || errorData?.message || errorMsg;
      } catch {}

      console.error('Lyzr API error:', errorMsg);
      return NextResponse.json(
        { error: errorMsg },
        { status: response.status }
      );
    }

    const parsed = parseLLMJson(rawText);

    if (parsed?.success === false && parsed?.error) {
      console.error('Agent error:', parsed.error);
      return NextResponse.json(
        { error: parsed.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: parsed
    });

  } catch (error) {
    console.error('Onboarding chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process onboarding chat' },
      { status: 500 }
    );
  }
}
