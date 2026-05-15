import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const TOKEN_KEY = 'etsy:tokens';

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

async function loadTokens(): Promise<StoredTokens | null> {
  const stored = await redis.get<StoredTokens>(TOKEN_KEY);
  if (stored && stored.accessToken && stored.refreshToken) return stored;

  const accessToken = process.env.ETSY_ACCESS_TOKEN;
  const refreshToken = process.env.ETSY_REFRESH_TOKEN;
  const expiresAt = Number(process.env.ETSY_TOKEN_EXPIRES_AT ?? 0);
  if (!accessToken || !refreshToken) return null;

  const seed: StoredTokens = { accessToken, refreshToken, expiresAt };
  await redis.set(TOKEN_KEY, seed);
  console.log('[Etsy] Seeded tokens into Redis from env vars');
  return seed;
}

async function persistTokens(tokens: StoredTokens): Promise<void> {
  await redis.set(TOKEN_KEY, tokens);
}

async function doRefresh(refreshToken: string): Promise<StoredTokens> {
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
  const tokens: StoredTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  await persistTokens(tokens);
  console.log('[Etsy] Token refreshed and persisted to Redis');
  return tokens;
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error('No tokens stored. Visit /api/auth/etsy to authorize.');

  if (Date.now() > tokens.expiresAt - 5 * 60 * 1000) {
    const refreshed = await doRefresh(tokens.refreshToken);
    return refreshed.accessToken;
  }

  return tokens.accessToken;
}

export async function saveTokensFromOAuth(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  await persistTokens({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  });
}
