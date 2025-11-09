import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function checkAuth(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('authenticated');
  return authenticated?.value === 'true';
}

// Type-safe auth wrapper for Next.js 15 Route Handlers
export function requireAuth<T extends Record<string, any> = any>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    const isAuthenticated = await checkAuth(request);

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}
