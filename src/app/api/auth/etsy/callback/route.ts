import { NextRequest, NextResponse } from 'next/server';
import { saveTokensToEnvLocal } from '@/lib/etsy-auth';

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

  const tokenRes = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: apiKey,
      ...(process.env.ETSY_API_SECRET ? { client_secret: process.env.ETSY_API_SECRET } : {}),
      redirect_uri: 'http://localhost:3000/api/auth/etsy/callback',
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
    saveTokensToEnvLocal(access_token, refresh_token, expires_in);
  } catch (e) {
    return NextResponse.json({
      error: '.env.local write failed',
      access_token,
      refresh_token,
      expires_in,
      manual_instructions: 'Add these values to .env.local manually, then restart the dev server.',
    }, { status: 200 });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;max-width:500px;margin:auto">
      <h2 style="color:#2d6a4f">✅ Etsy bağlantısı başarılı!</h2>
      <p>Token'lar <code>.env.local</code> dosyasına kaydedildi.</p>
      <p><strong>Dev sunucusunu yeniden başlatın:</strong> terminalde <code>Ctrl+C</code> → <code>npm run dev</code></p>
      <p>Ardından <a href="http://localhost:3000">localhost:3000</a> adresine gidin.</p>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
