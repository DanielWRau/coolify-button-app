import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function checkAuth(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('authenticated');

  // Log auth check for debugging
  const path = request.nextUrl.pathname;
  const hasCookie = !!authenticated;
  const isValid = authenticated?.value === 'true';

  // Log all cookies for debugging
  const allCookies = await cookies();
  const cookieNames = Array.from(allCookies.getAll().map(c => c.name));

  if (!hasCookie) {
    console.log(`[AUTH] ❌ No auth cookie for ${path}`);
    console.log(`[AUTH] 🍪 Available cookies: [${cookieNames.join(', ') || 'none'}]`);
  } else if (!isValid) {
    console.log(`[AUTH] ❌ Invalid auth cookie value for ${path}: ${authenticated.value}`);
  } else {
    console.log(`[AUTH] ✅ Valid auth for ${path}`);
  }

  return isValid;
}

// Type-safe auth wrapper for Next.js 15 Route Handlers
export function requireAuth<T extends Record<string, any> = any>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    const path = request.nextUrl.pathname;

    // Debug: Log ALL incoming headers
    const cookieHeader = request.headers.get('cookie');
    console.log(`[AUTH] 📥 Incoming request to ${path}`);
    console.log(`[AUTH] 🍪 Cookie header: ${cookieHeader || 'MISSING!'}`);

    const isAuthenticated = await checkAuth(request);

    if (!isAuthenticated) {
      console.log(`[AUTH] 🚫 Unauthorized access attempt to ${path}`);

      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}
