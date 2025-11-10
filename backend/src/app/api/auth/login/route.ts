import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const APP_PASSWORD = process.env.APP_PASSWORD || 'changeme123';

    // Log incoming request details
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'unknown';
    console.log(`[AUTH] Login attempt from ${host} (proto: ${proto})`);

    if (password === APP_PASSWORD) {
      // Generate JWT token
      const token = signToken({ authenticated: true });

      console.log(`[AUTH] ✅ Login successful - Token generated`);

      return NextResponse.json({
        success: true,
        token, // Return token to client
      });
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
