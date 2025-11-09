import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { generateArticle } from '@/lib/article-tools';
import { createArticle } from '@/lib/article-storage';

export async function POST(request: NextRequest) {
  const isAuthenticated = await checkAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }
  try {
    const { topic, focus, targetLength, tone } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic required' },
        { status: 400 }
      );
    }

    console.log(`Generating article for topic: ${topic}`);

    const result = await generateArticle(topic, {
      focus: focus || 'practical insights and best practices',
      targetLength: targetLength || 'medium',
      tone: tone || 'professional',
    });

    if (!result.success || !result.article) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate article' },
        { status: 500 }
      );
    }

    // Save article to storage
    const savedArticle = createArticle(result.article);

    return NextResponse.json({
      success: true,
      data: { article: savedArticle },
    });
  } catch (error) {
    console.error('Article generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Article generation failed' },
      { status: 500 }
    );
  }
}
