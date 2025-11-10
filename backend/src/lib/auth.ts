import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyToken } from './jwt';

export async function checkAuth(request: NextRequest): Promise<boolean> {
  const path = request.nextUrl.pathname;
  const authHeader = request.headers.get('authorization');

  console.log('[AUTH] Checking auth for ' + path);
  console.log('[AUTH] Authorization header: ' + (authHeader ? 'Present' : 'MISSING!'));

  const token = extractBearerToken(authHeader);

  if (!token) {
    console.log('[AUTH] No Bearer token found for ' + path);
    return false;
  }

  const payload = verifyToken(token);

  if (!payload || !payload.authenticated) {
    console.log('[AUTH] Invalid or expired token for ' + path);
    return false;
  }

  console.log('[AUTH] Valid token for ' + path);
  return true;
}

export function requireAuth<T extends Record<string, any> = any>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    const path = request.nextUrl.pathname;

    const isAuthenticated = await checkAuth(request);

    if (!isAuthenticated) {
      console.log('[AUTH] Unauthorized access attempt to ' + path);

      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}
