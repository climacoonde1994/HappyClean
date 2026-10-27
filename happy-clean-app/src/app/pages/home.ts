import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MIN_PRICE, PRODUCTS, PRODUCT_BY_ID, ProductId, SAME_PRICE } from '../data/products';
import { REVIEWS, ratingFor } from '../data/reviews';
import { STORE } from '../data/store';
import { CartService } from '../services/cart.service';
import { ToastService } from '../services/toast.service';
import { Stars } from '../components/stars';
import { QtyStepper } from '../components/qty-stepper';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe, Stars, QtyStepper],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  protected readonly store = STORE;
  protected readonly products = PRODUCTS;
  protected readonly minPrice = MIN_PRICE;
  protected readonly samePrice = SAME_PRICE;
  protected readonly categories = new Set(PRODUCTS.map((p) => p.category)).size;
  protected readonly reviews = REVIEWS;
  protected readonly rating = ratingFor;
  protected readonly productName = (id: ProductId) => {
    const p = PRODUCT_BY_ID.get(id);
    return p ? `${p.name} · ${p.scent}` : '';
  };

  // Write-a-review form
  protected readonly revProduct = signal<ProductId>(PRODUCTS[0]?.id ?? '');
  protected readonly revStars = signal(5);
  protected readonly revName = signal('');
  protected readonly revCity = signal('');
  protected readonly revText = signal('');
  protected readonly revMessage = computed(() =>
    [
      `${STORE.name} review`,
      `Product: ${this.productName(this.revProduct())}`,
      `Rating: ${'★'.repeat(this.revStars())}${'☆'.repeat(5 - this.revStars())} (${this.revStars()}/5)`,
      `Name: ${this.revName().trim() || '[your name]'}${this.revCity().trim() ? ', ' + this.revCity().trim() : ''}`,
      '',
      this.revText().trim() || '[your review]',
    ].join('\n'),
  );
  protected readonly revSms = computed(() => `sms:${STORE.mobile}?body=${encodeURIComponent(this.revMessage())}`);
  protected readonly revMail = computed(
    () => `mailto:${STORE.email}?subject=${encodeURIComponent('Happy Clean review')}&body=${encodeURIComponent(this.revMessage())}`,
  );

  add(id: ProductId): void {
    this.cart.add(id);
    this.toast.show('Added to your order');
  }

  copyReview(): void {
    this.toast.copy(this.revMessage(), 'Review copied');
  }

  copy(text: string): void {
    this.toast.copy(text);
  }
}
