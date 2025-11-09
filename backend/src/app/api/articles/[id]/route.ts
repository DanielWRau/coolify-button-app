import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import {
  getArticle,
  updateArticle,
  deleteArticle,
} from '@/lib/article-storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
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

    return NextResponse.json({ success: true, data: { article } });
  } catch (error) {
    console.error('Get article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load article' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  const isAuthenticated = await checkAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const params = await context.params;
  try {
    const { content, topic, outline, research } = await request.json();

    const updated = updateArticle(params.id, {
      content,
      topic,
      outline,
      research,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { article: updated } });
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  const isAuthenticated = await checkAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const params = await context.params;
  try {
    const deleted = deleteArticle(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
