import productsConfig from '../../config/products.json';

/**
 * Products are edited in src/config/products.json — not in this file.
 * This file reads that JSON, skips any product with a mistake (and logs why
 * in the browser console), and shares the list with the rest of the site.
 */

export type ProductId = string;

export interface Product {
  id: ProductId;
  name: string;
  scent: string;
  category: string;
  size: string;
  unit: string;
  price: number;
  image: string;
  color: string;
  features: string[];
  inStock: boolean;
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function clean(raw: unknown, index: number, seen: Set<string>): Product | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const label = text(r['id']) || `#${index + 1}`;
  const problem = (why: string) => {
    console.warn(`products.json: product ${label} skipped — ${why}`);
    return null;
  };
  const id = text(r['id']);
  if (!/^[a-z0-9-]+$/.test(id)) return problem(`"id" must use only lowercase letters, numbers and dashes`);
  if (seen.has(id)) return problem(`another product already uses the id "${id}"`);
  const price = Number(r['price']);
  if (!Number.isFinite(price) || price <= 0) return problem(`"price" must be a number above 0`);
  const required = ['name', 'scent', 'category', 'size', 'unit', 'image'] as const;
  for (const key of required) if (!text(r[key])) return problem(`"${key}" is empty`);
  const color = /^#[0-9a-fA-F]{6}$/.test(text(r['color'])) ? text(r['color']) : '#3a9be0';
  const features = Array.isArray(r['features']) ? r['features'].map(text).filter(Boolean).slice(0, 6) : [];
  seen.add(id);
  return {
    id,
    name: text(r['name']),
    scent: text(r['scent']),
    category: text(r['category']),
    size: text(r['size']),
    unit: text(r['unit']),
    price,
    image: text(r['image']).replace(/^\/+/, ''),
    color,
    features,
    inStock: r['inStock'] !== false,
  };
}

const seen = new Set<string>();
export const PRODUCTS: Product[] = (Array.isArray(productsConfig.products) ? productsConfig.products : [])
  .map((p: unknown, i: number) => clean(p, i, seen))
  .filter((p): p is Product => p !== null);

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

const prices = PRODUCTS.map((p) => p.price);
/** Lowest price, for "from ₱…" labels. */
export const MIN_PRICE = prices.length ? Math.min(...prices) : 0;
/** True when every product costs the same. */
export const SAME_PRICE = prices.every((p) => p === prices[0]);
/** Unit used in price labels when all products share one, else "item". */
export const COMMON_UNIT = PRODUCTS.every((p) => p.unit === PRODUCTS[0]?.unit) ? (PRODUCTS[0]?.unit ?? 'item') : 'item';
