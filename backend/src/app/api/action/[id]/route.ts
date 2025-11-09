import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { topic, useAI } = await request.json();
    const actionId = params.id;

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Action 1: LinkedIn Post via Browser-Use
    if (actionId === '1') {
      const browserUseApiKey = process.env.BROWSER_USE_API_KEY;
      const linkedinEmail = process.env.LINKEDIN_EMAIL;
      const linkedinPassword = process.env.LINKEDIN_PASSWORD;

      if (!browserUseApiKey || !linkedinEmail || !linkedinPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'LinkedIn credentials not configured. Set BROWSER_USE_API_KEY, LINKEDIN_EMAIL, LINKEDIN_PASSWORD'
          },
          { status: 500 }
        );
      }

      let postContent = topic;

      // Generate AI content if requested
      if (useAI) {
        const openrouterApiKey = process.env.OPENROUTER_API_KEY;
        const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

        if (!openrouterApiKey) {
          return NextResponse.json(
            { success: false, error: 'OpenRouter API key not configured' },
            { status: 500 }
          );
        }

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                content: 'You are a professional LinkedIn content creator. Create engaging, professional LinkedIn posts in plain text. Use line breaks, emojis, and clear structure. No HTML, no Markdown formatting. Keep it concise and impactful.'
              },
              {
                role: 'user',
                content: `Create a LinkedIn post about: ${topic}`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          throw new Error('AI generation failed');
        }

        const aiData = await aiResponse.json();
        postContent = aiData.choices[0].message.content;
      }

      // Call Browser-Use API to post to LinkedIn
      const browserUseResponse = await fetch('https://api.browser-use.com/v1/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${browserUseApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: `Log into LinkedIn with email ${linkedinEmail} and password ${linkedinPassword}, then create a new post with this text: "${postContent}"`,
          timeout: 180000, // 3 minutes
        }),
      });

      if (!browserUseResponse.ok) {
        const error = await browserUseResponse.text();
        throw new Error(`Browser-Use API error: ${error}`);
      }

      const browserUseData = await browserUseResponse.json();

      return NextResponse.json({
        success: true,
        message: 'LinkedIn post created successfully!',
        data: {
          task_id: browserUseData.id || 'unknown',
          status: browserUseData.status || 'queued',
          topic,
          ai_generated: useAI,
          content: postContent,
        },
      });
    }

    // Other actions not implemented yet
    return NextResponse.json(
      { success: false, error: `Action ${actionId} not implemented` },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
