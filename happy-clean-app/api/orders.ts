/**
 * Vercel serverless function: POST /api/orders
 *
 * Checks the order, recalculates the total from src/config/products.json,
 * and emails it to the store using Resend (https://resend.com).
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY    required to send email. Without it, orders are not emailed and the
 *                     customer is asked to send the order by text or email instead.
 *   ORDER_TO_EMAIL    where orders go. Default: happyclean.info.ph@gmail.com
 *   ORDER_FROM_EMAIL  sender. Default: Happy Clean Orders <onboarding@resend.dev>
 *                     (Resend's test sender only delivers to the email you signed up with.
 *                     Verify your own domain in Resend to send from it.)
 */

declare const process: { env: Record<string, string | undefined> };

import productsConfig from '../src/config/products.json';

type ProductId = string;

interface PriceInfo {
  name: string;
  unit: string;
  price: number;
}

// Prices come from src/config/products.json, the same file the website uses.
// Out-of-stock products and products with an invalid price can't be ordered.
const PRICES = new Map<ProductId, PriceInfo>();
for (const p of (productsConfig as { products?: unknown[] }).products ?? []) {
  const r = (p ?? {}) as Record<string, unknown>;
  const id = typeof r['id'] === 'string' ? r['id'].trim() : '';
  const price = Number(r['price']);
  if (!/^[a-z0-9-]+$/.test(id) || PRICES.has(id) || !Number.isFinite(price) || price <= 0 || r['inStock'] === false) continue;
  PRICES.set(id, {
    name: `${String(r['name'] ?? '').trim()} (${String(r['scent'] ?? '').trim()})`,
    unit: String(r['unit'] ?? 'pc').trim() || 'pc',
    price,
  });
}

const TIME_LABELS: Record<string, string> = {
  morning: 'Morning (8 AM – 12 NN)',
  afternoon: 'Afternoon (1 PM – 5 PM)',
  anytime: 'Any time',
};
const PAY_LABELS: Record<string, string> = {
  cod: 'Cash on delivery / pick-up',
  gcash: 'GCash',
  bank: 'Bank transfer',
};

interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const peso = (n: number) => '₱' + n.toLocaleString('en-PH');

function orderNumber(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000); // Philippine time
  const p = (n: number) => String(n).padStart(2, '0');
  return `HC-${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Use POST.' });
    return;
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Missing order details.' });
    return;
  }

  // Honeypot: bots fill hidden fields. Pretend success, send nothing.
  if (str(body.website, 200)) {
    res.status(200).json({ orderNumber: orderNumber(), emailed: false });
    return;
  }

  // Items
  const merged = new Map<ProductId, number>();
  for (const item of Array.isArray(body.items) ? body.items.slice(0, 20) : []) {
    const id = item?.productId as ProductId;
    const qty = Math.floor(Number(item?.quantity));
    if (!PRICES.has(id) || !Number.isFinite(qty) || qty < 1 || qty > 999) continue;
    merged.set(id, Math.min(999, (merged.get(id) ?? 0) + qty));
  }
  if (!merged.size) {
    res.status(400).json({ error: 'Your order has no products, or some products are out of stock.' });
    return;
  }
  const lines = [...merged].map(([productId, quantity]) => ({
    productId,
    name: PRICES.get(productId)!.name,
    unit: PRICES.get(productId)!.unit,
    quantity,
    unitPrice: PRICES.get(productId)!.price,
    lineTotal: PRICES.get(productId)!.price * quantity,
  }));
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);

  // Customer
  const name = str(body.customer?.name, 80);
  const mobile = str(body.customer?.mobile, 20).replace(/[\s-]/g, '');
  const email = str(body.customer?.email, 120);
  if (!name) return void res.status(400).json({ error: 'Please enter your name.' });
  if (!/^(\+?63|0)9\d{9}$/.test(mobile)) return void res.status(400).json({ error: 'Please enter a valid mobile number.' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return void res.status(400).json({ error: 'Please check your email address.' });

  const fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'delivery';
  const address =
    fulfillment === 'delivery'
      ? {
          street: str(body.address?.street, 160),
          barangay: str(body.address?.barangay, 80),
          city: str(body.address?.city, 80),
          province: str(body.address?.province, 80),
          landmark: str(body.address?.landmark, 160),
        }
      : null;
  if (address && (!address.street || !address.barangay || !address.city || !address.province)) {
    res.status(400).json({ error: 'Please complete your delivery address.' });
    return;
  }

  const preferredDate = /^\d{4}-\d{2}-\d{2}$/.test(str(body.preferredDate, 10)) ? str(body.preferredDate, 10) : '';
  const preferredTime = TIME_LABELS[body.preferredTime] ? body.preferredTime : 'anytime';
  const paymentMethod = PAY_LABELS[body.paymentMethod] ? body.paymentMethod : 'cod';
  const notes = str(body.notes, 500);
  const number = orderNumber();

  // Email
  let emailed = false;
  const apiKey = process.env['RESEND_API_KEY'];
  if (apiKey) {
    const to = process.env['ORDER_TO_EMAIL'] || 'happyclean.info.ph@gmail.com';
    const from = process.env['ORDER_FROM_EMAIL'] || 'Happy Clean Orders <onboarding@resend.dev>';
    const where = address
      ? `${address.street}, ${address.barangay}, ${address.city}, ${address.province}${address.landmark ? ` (Landmark: ${address.landmark})` : ''}`
      : 'Pick-up';

    const text = [
      `New order ${number}`,
      '',
      ...lines.map((l) => `${l.quantity} ${l.unit} x ${l.name} @ ${peso(l.unitPrice)} = ${peso(l.lineTotal)}`),
      `Subtotal: ${peso(subtotal)}${address ? ' + delivery fee' : ''}`,
      '',
      `Customer: ${name}`,
      `Mobile: ${mobile}`,
      email ? `Email: ${email}` : '',
      `${address ? 'Deliver to' : 'Fulfillment'}: ${where}`,
      `Preferred: ${preferredDate || 'not set'}, ${TIME_LABELS[preferredTime]}`,
      `Payment: ${PAY_LABELS[paymentMethod]}`,
      notes ? `Notes: ${notes}` : '',
    ]
      .filter((l) => l !== '')
      .join('\n');

    const rows = lines
      .map(
        (l) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5eaf1">${esc(l.name)}</td><td style="padding:6px 10px;border-bottom:1px solid #e5eaf1;text-align:right">${l.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #e5eaf1;text-align:right">${peso(l.lineTotal)}</td></tr>`,
      )
      .join('');
    const html = `
      <div style="font-family:Arial,sans-serif;color:#0c2a5c;max-width:560px">
        <h2 style="margin:0 0 4px">New order ${esc(number)}</h2>
        <p style="margin:0 0 16px;color:#56698a">${esc(new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }))}</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr style="background:#eaf1f8"><th style="padding:6px 10px;text-align:left">Item</th><th style="padding:6px 10px;text-align:right">Qty</th><th style="padding:6px 10px;text-align:right">Total</th></tr>
          ${rows}
          <tr><td colspan="2" style="padding:8px 10px;font-weight:bold">Subtotal${address ? ' (+ delivery fee)' : ''}</td><td style="padding:8px 10px;text-align:right;font-weight:bold">${peso(subtotal)}</td></tr>
        </table>
        <p style="margin:16px 0 4px"><b>${esc(name)}</b> · ${esc(mobile)}${email ? ' · ' + esc(email) : ''}</p>
        <p style="margin:0 0 4px">${address ? 'Deliver to: ' : ''}${esc(where)}</p>
        <p style="margin:0 0 4px">Preferred: ${esc(preferredDate || 'not set')}, ${esc(TIME_LABELS[preferredTime])}</p>
        <p style="margin:0 0 4px">Payment: ${esc(PAY_LABELS[paymentMethod])}</p>
        ${notes ? `<p style="margin:0 0 4px">Notes: ${esc(notes)}</p>` : ''}
      </div>`;

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email || undefined,
          subject: `New order ${number} · ${name} · ${peso(subtotal)}`,
          text,
          html,
        }),
      });
      emailed = r.ok;
      if (!r.ok) console.error('Resend error', r.status, await r.text());
    } catch (err) {
      console.error('Resend request failed', err);
    }
  }

  res.status(200).json({ orderNumber: number, emailed, lines, subtotal });
}
