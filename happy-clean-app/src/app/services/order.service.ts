import { Injectable } from '@angular/core';
import { ProductId } from '../data/products';
import { STORE } from '../data/store';

export type Fulfillment = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'gcash' | 'bank';
export type PreferredTime = 'morning' | 'afternoon' | 'anytime';

export interface OrderRequest {
  items: { productId: ProductId; quantity: number }[];
  customer: { name: string; mobile: string; email?: string };
  fulfillment: Fulfillment;
  address?: { street: string; barangay: string; city: string; province: string; landmark?: string };
  preferredDate: string;
  preferredTime: PreferredTime;
  paymentMethod: PaymentMethod;
  notes?: string;
  /** Honeypot: real people leave this empty. */
  website?: string;
}

export interface OrderLine {
  productId: ProductId;
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderRecord {
  orderNumber: string;
  createdAt: string;
  /** true when the server emailed the order to the store */
  sent: boolean;
  lines: OrderLine[];
  subtotal: number;
  request: OrderRequest;
}

export const TIME_LABELS: Record<PreferredTime, string> = {
  morning: 'Morning (8 AM – 12 NN)',
  afternoon: 'Afternoon (1 PM – 5 PM)',
  anytime: 'Any time',
};

export const PAY_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery / pick-up',
  gcash: 'GCash',
  bank: 'Bank transfer',
};

const KEY = 'happyclean.orders.v1';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private memory: OrderRecord[] = [];

  /**
   * Sends the order to /api/orders (a Vercel function that emails it to the store).
   * If the API is unreachable or not set up, the order is still saved on this device
   * and the confirmation page asks the customer to send it by text or email.
   */
  async submit(request: OrderRequest, lines: OrderLine[], subtotal: number): Promise<OrderRecord> {
    let record: OrderRecord = {
      orderNumber: makeOrderNumber(),
      createdAt: new Date().toISOString(),
      sent: false,
      lines,
      subtotal,
      request,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        const data = (await res.json()) as Partial<OrderRecord> & { emailed?: boolean };
        record = {
          ...record,
          orderNumber: data.orderNumber ?? record.orderNumber,
          lines: data.lines ?? record.lines,
          subtotal: data.subtotal ?? record.subtotal,
          sent: data.emailed === true,
        };
      } else if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        throw new OrderError(data.error ?? 'Please check your details and try again.');
      }
    } catch (err) {
      if (err instanceof OrderError) throw err;
      /* offline or no API: keep record.sent = false */
    }

    this.save(record);
    return record;
  }

  get(orderNumber: string): OrderRecord | undefined {
    return this.readAll().find((o) => o.orderNumber === orderNumber);
  }

  /** Plain-text order the customer can send by SMS, email or Messenger. */
  messageFor(o: OrderRecord): string {
    const r = o.request;
    const lines = [
      `Hi ${STORE.name}! Order ${o.orderNumber}`,
      ...o.lines.map((l) => `- ${l.quantity} ${l.unit ?? 'pc'} ${l.name} = ₱${l.lineTotal.toLocaleString('en-PH')}`),
      `Total: ₱${o.subtotal.toLocaleString('en-PH')}${r.fulfillment === 'delivery' ? ' + delivery fee' : ''}`,
      '',
      `Name: ${r.customer.name}`,
      `Mobile: ${r.customer.mobile}`,
      r.fulfillment === 'delivery' && r.address
        ? `Delivery: ${r.address.street}, ${r.address.barangay}, ${r.address.city}, ${r.address.province}${r.address.landmark ? ` (Landmark: ${r.address.landmark})` : ''}`
        : 'Pick-up',
      `Preferred: ${r.preferredDate}, ${TIME_LABELS[r.preferredTime]}`,
      `Payment: ${PAY_LABELS[r.paymentMethod]}`,
    ];
    if (r.notes) lines.push(`Notes: ${r.notes}`);
    return lines.join('\n');
  }

  private readAll(): OrderRecord[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
      return this.memory;
    }
  }

  private save(record: OrderRecord): void {
    this.memory = [record, ...this.memory];
    try {
      localStorage.setItem(KEY, JSON.stringify([record, ...this.readAll()].slice(0, 30)));
    } catch {
      /* ignore */
    }
  }
}

export class OrderError extends Error {}

function makeOrderNumber(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `HC-${p(d.getFullYear() % 100)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
}
