import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getArticle, updateArticle } from '@/lib/article-storage';
import {
  formatForBrowserUse,
  generateBrowserUseTask,
} from '@/lib/browser-use-formatter';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  const isAuthenticated = await checkAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const params = await context.params;
  try {
    const article = getArticle(params.id);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check for required Browser-Use credentials
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

    // Format article content for Browser-Use step-by-step typing
    const formattedContent = formatForBrowserUse(article.content);
    const browserUseTask = generateBrowserUseTask(linkedinEmail, linkedinPassword, formattedContent);

    console.log('[BROWSER-USE] Article posting task:', browserUseTask);

    const browserUseResponse = await fetch('https://api.browser-use.com/api/v1/run-task', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${browserUseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: browserUseTask,
        timeout: 300000, // 5 minutes for article posting
      }),
    });

    if (!browserUseResponse.ok) {
      const error = await browserUseResponse.text();
      throw new Error(`Browser-Use API error: ${error}`);
    }

    const browserUseData = await browserUseResponse.json();

    // Update article status
    const updatedArticle = updateArticle(params.id, {
      status: 'posted',
      postedAt: new Date().toISOString(),
      taskId: browserUseData.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Article posted to LinkedIn successfully',
      data: {
        article: updatedArticle,
        task: {
          id: browserUseData.id,
          live_url: browserUseData.live_url,
        },
      },
    });
  } catch (error: any) {
    console.error('Post article error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to post article'
      },
      { status: 500 }
    );
  }
}
