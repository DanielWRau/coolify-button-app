import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  BROWSER_USE_SYSTEM_PROMPT,
  formatForBrowserUse,
  generateBrowserUseTask,
} from '@/lib/browser-use-formatter';
import { researchTopic, createResearchEnhancedPrompt } from '@/lib/perplexity-research';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handler(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const params = await context.params;
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

        // STEP 1: Research topic with Perplexity (online search)
        console.log('[POST] Step 1: Researching topic with Perplexity...');
        const research = await researchTopic(topic);
        console.log('[POST] Research completed:', {
          hasResearch: !!research.summary,
          keyPointsCount: research.keyPoints.length,
          sourcesCount: research.sources.length,
        });

        // STEP 2: Generate post with research-enhanced prompt
        console.log('[POST] Step 2: Generating post with AI...');
        const enhancedPrompt = createResearchEnhancedPrompt(BROWSER_USE_SYSTEM_PROMPT, research);

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
                content: enhancedPrompt
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

        console.log('[AI] Generated post content:', postContent);
      }

      // Format post content for Browser-Use step-by-step typing
      const formattedContent = formatForBrowserUse(postContent);
      const browserUseTask = generateBrowserUseTask(linkedinEmail, linkedinPassword, formattedContent);

      console.log('[BROWSER-USE] Task instructions:', browserUseTask);

      // Call Browser-Use API to post to LinkedIn
      const browserUseResponse = await fetch('https://api.browser-use.com/api/v1/run-task', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${browserUseApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: browserUseTask,
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

export const POST = requireAuth<RouteContext>(handler);
