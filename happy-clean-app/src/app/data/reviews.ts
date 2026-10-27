import { ProductId, PRODUCT_BY_ID } from './products';
import reviewsConfig from '../../config/reviews.json';

/**
 * Reviews are edited in src/config/reviews.json — not in this file.
 * This file reads that JSON, skips any entry with a mistake (and logs why
 * in the browser console), and works out the star averages.
 */

export interface Review {
  product: ProductId;
  stars: number;
  name: string;
  city?: string;
  date?: string;
  text: string;
}

function clean(raw: unknown, index: number): Review | null {
  const r = raw as Record<string, unknown>;
  const problem = (why: string) => {
    console.warn(`reviews.json: review #${index + 1} skipped — ${why}`);
    return null;
  };
  if (!r || typeof r !== 'object') return problem('not an object');
  const product = String(r['product'] ?? '').trim() as ProductId;
  if (!PRODUCT_BY_ID.has(product)) return problem(`"product" "${product}" doesn't match any id in products.json`);
  const stars = Number(r['stars']);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return problem(`"stars" must be a whole number from 1 to 5`);
  const name = String(r['name'] ?? '').trim();
  if (!name) return problem(`"name" is empty`);
  const text = String(r['text'] ?? '').trim();
  if (!text) return problem(`"text" is empty`);
  const city = String(r['city'] ?? '').trim() || undefined;
  const date = String(r['date'] ?? '').trim() || undefined;
  return { product, stars, name, city, date, text };
}

export const REVIEWS: Review[] = (Array.isArray(reviewsConfig.reviews) ? reviewsConfig.reviews : [])
  .map((r: unknown, i: number) => clean(r, i))
  .filter((r): r is Review => r !== null);

export function ratingFor(id: ProductId): { count: number; average: number } {
  const list = REVIEWS.filter((r) => r.product === id);
  const count = list.length;
  const average = count ? list.reduce((sum, r) => sum + r.stars, 0) / count : 0;
  return { count, average };
}
