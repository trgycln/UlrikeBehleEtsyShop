import { NextRequest, NextResponse } from 'next/server';
import { saveTokensFromOAuth } from '@/lib/etsy-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `Etsy denied access: ${error}` }, { status: 400 });
  }

  const codeVerifier = request.cookies.get('etsy_cv')?.value;
  const savedState = request.cookies.get('etsy_state')?.value;

  if (!code || !codeVerifier) {
    return NextResponse.json({ error: 'Missing code or code_verifier' }, { status: 400 });
  }
  if (state !== savedState) {
    return NextResponse.json({ error: 'State mismatch — possible CSRF' }, { status: 400 });
  }

  const apiKey = process.env.ETSY_API_KEY!;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/etsy/callback`;

  const tokenRes = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: apiKey,
      ...(process.env.ETSY_API_SECRET ? { client_secret: process.env.ETSY_API_SECRET } : {}),
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
    cache: 'no-store',
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.json({ error: 'Token exchange failed', details: err }, { status: 400 });
  }

  const { access_token, refresh_token, expires_in } = await tokenRes.json();

  try {
    await saveTokensFromOAuth(access_token, refresh_token, expires_in);
  } catch (e) {
    return NextResponse.json({
      error: 'Redis write failed',
      details: String(e),
      access_token,
      refresh_token,
      expires_in,
    }, { status: 500 });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;padding:2rem;max-width:500px;margin:auto">
      <h2 style="color:#2d6a4f">Etsy bağlantısı başarılı</h2>
      <p>Token'lar Upstash Redis'e kaydedildi ve otomatik olarak yenilenecektir.</p>
      <p><a href="/">Ana sayfaya dön</a></p>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
