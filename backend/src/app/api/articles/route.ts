import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getAllArticles } from '@/lib/article-storage';

export async function GET(request: NextRequest) {
  const isAuthenticated = await checkAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const articles = getAllArticles();
    return NextResponse.json({ success: true, data: { articles } });
  } catch (error) {
    console.error('Get articles error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load articles' },
      { status: 500 }
    );
  }
}
