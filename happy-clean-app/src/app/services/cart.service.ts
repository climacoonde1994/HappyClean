import { Injectable, computed, effect, signal } from '@angular/core';
import { PRODUCT_BY_ID, ProductId } from '../data/products';

export interface CartLine {
  productId: ProductId;
  name: string;
  scent: string;
  image: string;
  color: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const KEY = 'happyclean.cart.v1';
export const MAX_QTY = 999;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly quantities = signal<Partial<Record<ProductId, number>>>(this.load());

  readonly lines = computed<CartLine[]>(() =>
    Object.entries(this.quantities())
      .map(([id, quantity]) => {
        const p = PRODUCT_BY_ID.get(id as ProductId);
        if (!p || !p.inStock || !quantity) return null;
        return {
          productId: p.id,
          name: p.name,
          scent: p.scent,
          image: p.image,
          color: p.color,
          unit: p.unit,
          quantity,
          unitPrice: p.price,
          lineTotal: p.price * quantity,
        };
      })
      .filter((l): l is CartLine => l !== null),
  );

  readonly totalQty = computed(() => this.lines().reduce((n, l) => n + l.quantity, 0));
  readonly subtotal = computed(() => this.lines().reduce((n, l) => n + l.lineTotal, 0));

  constructor() {
    effect(() => this.save(this.quantities()));
  }

  qtyOf(id: ProductId): number {
    return this.quantities()[id] ?? 0;
  }

  add(id: ProductId, by = 1): void {
    this.setQty(id, this.qtyOf(id) + by);
  }

  setQty(id: ProductId, value: number): void {
    if (!PRODUCT_BY_ID.get(id)?.inStock && value > 0) return;
    const q = Math.min(MAX_QTY, Math.max(0, Math.floor(Number(value) || 0)));
    this.quantities.update((current) => {
      const next = { ...current };
      if (q === 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }

  clear(): void {
    this.quantities.set({});
  }

  private load(): Partial<Record<ProductId, number>> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private save(value: Partial<Record<ProductId, number>>): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* storage unavailable: cart lives in memory only */
    }
  }
}
