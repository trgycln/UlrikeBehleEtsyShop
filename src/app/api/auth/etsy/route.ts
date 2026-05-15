import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ETSY_API_KEY missing' }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/etsy/callback`;

  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'listings_r shops_r',
    client_id: apiKey,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(
    `https://www.etsy.com/oauth/connect?${params}`
  );

  response.cookies.set('etsy_cv', codeVerifier, { httpOnly: true, maxAge: 600, path: '/' });
  response.cookies.set('etsy_state', state, { httpOnly: true, maxAge: 600, path: '/' });

  return response;
}
