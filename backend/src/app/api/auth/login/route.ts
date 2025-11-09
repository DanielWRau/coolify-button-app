import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const APP_PASSWORD = process.env.APP_PASSWORD || 'changeme123';

    // Log incoming request details
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'unknown';
    console.log(`[AUTH] Login attempt from ${host} (proto: ${proto})`);

    if (password === APP_PASSWORD) {
      // Determine if we're behind HTTPS proxy
      const isHttps = proto === 'https';

      // Set session cookie
      const cookieStore = await cookies();
      const cookieOptions = {
        httpOnly: true,
        secure: isHttps, // Use X-Forwarded-Proto instead of NODE_ENV
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
      };

      cookieStore.set('authenticated', 'true', cookieOptions);

      console.log(`[AUTH] ✅ Login successful, cookie set (secure: ${cookieOptions.secure}, sameSite: ${cookieOptions.sameSite})`);

      return NextResponse.json({ success: true });
    } else {
      console.log('[AUTH] ❌ Login failed: Invalid password');
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[AUTH] ❌ Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
