import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { scheduleArticle as scheduleArticleInStorage } from '@/lib/article-storage';

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
    const { scheduledFor } = await request.json();

    if (!scheduledFor) {
      return NextResponse.json(
        { success: false, error: 'scheduledFor date required' },
        { status: 400 }
      );
    }

    const article = scheduleArticleInStorage(params.id, scheduledFor);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article scheduled successfully',
      data: { article },
    });
  } catch (error: any) {
    console.error('Schedule article error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to schedule article'
      },
      { status: 500 }
    );
  }
}
