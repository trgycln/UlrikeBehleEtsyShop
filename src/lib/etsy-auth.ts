import fs from 'fs';
import path from 'path';

function updateEnvLine(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  return regex.test(content)
    ? content.replace(regex, `${key}=${value}`)
    : content + `\n${key}=${value}`;
}

async function doRefresh(): Promise<string> {
  const refreshToken = process.env.ETSY_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('No refresh token available');

  const res = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ETSY_API_KEY!,
      ...(process.env.ETSY_API_SECRET ? { client_secret: process.env.ETSY_API_SECRET } : {}),
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json();
  const expiresAt = String(Date.now() + data.expires_in * 1000);

  process.env.ETSY_ACCESS_TOKEN = data.access_token;
  if (data.refresh_token) process.env.ETSY_REFRESH_TOKEN = data.refresh_token;
  process.env.ETSY_TOKEN_EXPIRES_AT = expiresAt;

  if (process.env.NODE_ENV === 'development') {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let content = fs.readFileSync(envPath, 'utf-8');
      content = updateEnvLine(content, 'ETSY_ACCESS_TOKEN', data.access_token);
      if (data.refresh_token) {
        content = updateEnvLine(content, 'ETSY_REFRESH_TOKEN', data.refresh_token);
      }
      content = updateEnvLine(content, 'ETSY_TOKEN_EXPIRES_AT', expiresAt);
      fs.writeFileSync(envPath, content);
    } catch {
      // .env.local write failed — in-memory update still applies
    }
  }

  return data.access_token;
}

export async function getValidAccessToken(): Promise<string> {
  const accessToken = process.env.ETSY_ACCESS_TOKEN;
  const expiresAt = Number(process.env.ETSY_TOKEN_EXPIRES_AT ?? 0);

  if (!accessToken) throw new Error('No access token. Visit /api/auth/etsy to authorize.');

  // Refresh 5 minutes before expiry
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    return doRefresh();
  }

  return accessToken;
}

export function saveTokensToEnvLocal(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  const expiresAt = String(Date.now() + expiresIn * 1000);

  process.env.ETSY_ACCESS_TOKEN = accessToken;
  process.env.ETSY_REFRESH_TOKEN = refreshToken;
  process.env.ETSY_TOKEN_EXPIRES_AT = expiresAt;

  const envPath = path.join(process.cwd(), '.env.local');
  let content = fs.readFileSync(envPath, 'utf-8');
  content = updateEnvLine(content, 'ETSY_ACCESS_TOKEN', accessToken);
  content = updateEnvLine(content, 'ETSY_REFRESH_TOKEN', refreshToken);
  content = updateEnvLine(content, 'ETSY_TOKEN_EXPIRES_AT', expiresAt);
  fs.writeFileSync(envPath, content);
}
