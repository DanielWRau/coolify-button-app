import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const isHttps = proto === 'https';

  console.log('[AUTH] 🚪 Logout request');

  // CRITICAL: Set cookie on RESPONSE to delete it
  // NO domain attribute = matches login cookie (browser auto-sets domain)
  const response = NextResponse.json({ success: true });
  response.cookies.set('authenticated', '', {
    httpOnly: true,
    secure: isHttps, // Match login cookie settings
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  console.log('[AUTH] ✅ Logout successful, cookie deleted');

  return response;
}
