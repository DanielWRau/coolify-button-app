import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const isHttps = proto === 'https';

  // Extract domain from Host header (must match login cookie domain)
  const hostHeader = request.headers.get('host') || '';
  const domain = hostHeader.split(':')[0];

  console.log('[AUTH] 🚪 Logout request');

  // CRITICAL: Set cookie on RESPONSE to delete it
  const response = NextResponse.json({ success: true });
  response.cookies.set('authenticated', '', {
    httpOnly: true,
    secure: isHttps, // Match login cookie settings
    sameSite: 'lax',
    path: '/',
    domain: domain, // CRITICAL: Must match login cookie domain
    maxAge: 0, // Expire immediately
  });

  console.log(`[AUTH] ✅ Logout successful, cookie deleted for domain=${domain}`);

  return response;
}
