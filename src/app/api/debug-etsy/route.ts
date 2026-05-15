import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/etsy-auth';

export async function GET() {
  const apiKey = process.env.ETSY_API_KEY;
  const apiSecret = process.env.ETSY_API_SECRET;
  const shopName = process.env.ETSY_SHOP_NAME;

  if (!apiKey || !shopName) {
    return NextResponse.json({ error: 'Missing ETSY_API_KEY or ETSY_SHOP_NAME' });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (e) {
    return NextResponse.json({ error: 'No access token', details: String(e) });
  }

  const headers = {
    'x-api-key': apiSecret ? `${apiKey}:${apiSecret}` : apiKey,
    'Authorization': `Bearer ${accessToken}`,
  };

  const shopRes = await fetch(
    `https://openapi.etsy.com/v3/application/shops?shop_name=${shopName}`,
    { headers, cache: 'no-store' }
  );
  const shopBody = await shopRes.text();
  if (!shopRes.ok) {
    return NextResponse.json({ stage: 'shop', status: shopRes.status, body: shopBody });
  }
  const shopData = JSON.parse(shopBody);
  const shopId = shopData.results?.[0]?.shop_id;
  if (!shopId) {
    return NextResponse.json({ stage: 'shop', error: 'shop_id not found', shopData });
  }

  const listingsRes = await fetch(
    `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?includes=Images&limit=100`,
    { headers, cache: 'no-store' }
  );
  const listingsBody = await listingsRes.text();
  if (!listingsRes.ok) {
    return NextResponse.json({ stage: 'listings', status: listingsRes.status, body: listingsBody });
  }
  const listingsData = JSON.parse(listingsBody);

  const firstListingId = listingsData.results?.[0]?.listing_id;
  let imagesProbe: unknown = null;
  if (firstListingId) {
    const imgRes = await fetch(
      `https://openapi.etsy.com/v3/application/listings/${firstListingId}/images`,
      { headers, cache: 'no-store' }
    );
    imagesProbe = {
      status: imgRes.status,
      body: await imgRes.text(),
    };
  }

  return NextResponse.json({
    shopId,
    shopName,
    count: listingsData.count,
    resultsLength: listingsData.results?.length,
    firstListingId,
    imagesProbe,
  });
}
