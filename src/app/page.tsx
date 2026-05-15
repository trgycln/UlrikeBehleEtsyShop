import HomeClient, { type Product } from './HomeClient';
import { getValidAccessToken } from '@/lib/etsy-auth';

type EtsyImage = { url_570xN: string };

type EtsyListing = {
  listing_id: number;
  title: string;
  price: { amount: number; divisor: number };
  url: string;
  tags?: string[];
  taxonomy_path?: string[];
  images?: EtsyImage[];
};

function mapCategory(title: string, tags: string[] = [], taxonomy: string[] = []): string {
  const terms = [title, ...tags, ...taxonomy].join(' ').toLowerCase();

  if (/\bohrring|earring|ohrhänger|ohrstecker/.test(terms)) return 'Ohrringe';
  if (/\bring\b|\branlassring|fingerring/.test(terms) && !/ohrring/.test(terms)) return 'Ringe';
  if (/armband|bracelet|armkette/.test(terms)) return 'Armbänder';
  if (/kette|necklace|halskette|collier|anhänger|pendant/.test(terms)) return 'Ketten';
  if (/häkel|crochet|körbchen|gehäkelt/.test(terms)) return 'Häkelarbeiten';
  if (/schlüssel|keychain|schlüsselanhänger/.test(terms)) return 'Accessoires';
  return 'Sonstiges';
}

async function fetchAllListings(
  shopId: number,
  headers: Record<string, string>
): Promise<EtsyListing[]> {
  const all: EtsyListing[] = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const res = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      console.error('[Etsy] Listings page failed:', res.status, await res.text());
      break;
    }
    const data = await res.json();
    const results = (data.results ?? []) as EtsyListing[];
    if (results.length === 0) break;
    all.push(...results);
    if (results.length < limit) break;
    offset += limit;
  }

  return all;
}

async function fetchEtsyProducts(): Promise<Product[]> {
  const apiKey = process.env.ETSY_API_KEY;
  const apiSecret = process.env.ETSY_API_SECRET;
  const shopName = process.env.ETSY_SHOP_NAME;
  if (!apiKey || !shopName) return [];

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch {
    console.error('No valid Etsy access token. Visit http://localhost:3000/api/auth/etsy to authorize.');
    return [];
  }

  const headers = {
    'x-api-key': apiSecret ? `${apiKey}:${apiSecret}` : apiKey,
    'Authorization': `Bearer ${accessToken}`,
  };

  const shopRes = await fetch(
    `https://openapi.etsy.com/v3/application/shops?shop_name=${shopName}`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!shopRes.ok) {
    console.error('Shop fetch failed:', shopRes.status, await shopRes.text());
    return [];
  }

  const shopData = await shopRes.json();
  const shopId: number | undefined = shopData.results?.[0]?.shop_id;
  if (!shopId) {
    console.error('[Etsy] Shop ID not found for shop_name:', shopName);
    return [];
  }

  const listings = await fetchAllListings(shopId, headers);
  console.log('[Etsy] Total listings fetched:', listings.length);

  const imageMap = new Map<number, string>();
  for (let i = 0; i < listings.length; i += 100) {
    const chunk = listings.slice(i, i + 100);
    const ids = chunk.map(l => l.listing_id).join(',');
    const batchRes = await fetch(
      `https://openapi.etsy.com/v3/application/listings/batch?listing_ids=${ids}&includes=Images`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!batchRes.ok) {
      console.error('[Etsy] Batch fetch failed:', batchRes.status, await batchRes.text());
      continue;
    }
    const batchData = await batchRes.json();
    for (const item of (batchData.results ?? []) as EtsyListing[]) {
      const url = item.images?.[0]?.url_570xN;
      if (url) imageMap.set(item.listing_id, url);
    }
  }
  console.log('[Etsy] Images resolved via batch:', imageMap.size, '/', listings.length);

  const mapped = listings.map(listing => ({
    listing_id: listing.listing_id,
    title: listing.title,
    price: listing.price.amount / listing.price.divisor,
    category: mapCategory(listing.title, listing.tags, listing.taxonomy_path),
    url: listing.url || `https://www.etsy.com/listing/${listing.listing_id}`,
    image: imageMap.get(listing.listing_id) ?? '',
  }));

  const withImages = mapped.filter(p => p.image);
  console.log('[Etsy] Mapped:', mapped.length, '/ with images:', withImages.length);
  return withImages;
}

export default async function Home() {
  const products = await fetchEtsyProducts();
  return <HomeClient products={products} />;
}
