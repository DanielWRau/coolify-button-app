import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

async function handler(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    if (!openrouterApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional LinkedIn content creator. Create engaging, professional LinkedIn posts in plain text. Use line breaks, emojis, and clear structure. No HTML, no Markdown formatting. Keep it concise and impactful (200-300 words max).'
          },
          {
            role: 'user',
            content: `Create a LinkedIn post about: ${topic}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      data: { content },
    });

  } catch (error: any) {
    console.error('Generate post error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate post'
      },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handler);
