import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { count = 5 } = await request.json();

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
            content: 'You are a LinkedIn content strategist. Generate trending, relevant topic ideas for LinkedIn posts. Return ONLY a JSON array of topic strings, nothing else. Topics should be professional, current, and engaging.'
          },
          {
            role: 'user',
            content: `Generate ${count} trending LinkedIn post topic ideas. Return as JSON array: ["topic1", "topic2", ...]`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    let topics: string[];
    try {
      const parsed = JSON.parse(content);
      topics = parsed.topics || Object.values(parsed)[0] || [];
    } catch {
      // Fallback if AI didn't return proper JSON
      topics = [
        'AI and the Future of Work',
        'Remote Work Best Practices',
        'Leadership in Tech',
        'Innovation and Entrepreneurship',
        'Professional Development Tips'
      ].slice(0, count);
    }

    return NextResponse.json({
      success: true,
      data: { topics },
    });

  } catch (error: any) {
    console.error('Generate topics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate topics'
      },
      { status: 500 }
    );
  }
}
