import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';
import { STORE } from '../data/store';
import { COMMON_UNIT, MIN_PRICE, SAME_PRICE } from '../data/products';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="topbar">
      <div class="wrap row">
        <span>Order online, by text or call · @if (samePrice) {<b>₱{{ minPrice | number }} per {{ unit }}</b> on every product} @else {prices from <b>₱{{ minPrice | number }}</b>}</span>
        <span class="contacts"><span>{{ store.mobileDisplay }}</span><span>{{ store.email }}</span></span>
      </div>
    </div>
    <header class="bar">
      <div class="wrap row">
        <a class="brand" routerLink="/" aria-label="Happy Clean home">
          <img class="mark" src="images/mark.png" alt="" width="50" height="50" />
          <span>
            <span class="wordmark"><span class="h">Happy</span>&nbsp;<span class="c">Clean</span></span>
            <small>{{ store.tagline }}</small>
          </span>
        </a>
        <nav [class.open]="menuOpen()" aria-label="Main" (click)="menuOpen.set(false)">
          <a routerLink="/" fragment="products">Products</a>
          <a routerLink="/" fragment="why">Why Happy Clean</a>
          <a routerLink="/" fragment="reviews">Reviews</a>
          <a routerLink="/" fragment="contact">Contact</a>
        </nav>
        <a class="cart-btn" routerLink="/order" aria-label="Your order">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/></svg>
          <span class="lbl">Order</span><span class="count num">{{ cart.totalQty() }}</span>
        </a>
        <button class="menu-btn" type="button" [attr.aria-expanded]="menuOpen()" aria-label="Menu" (click)="menuOpen.set(!menuOpen())">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </header>
  `,
  styles: `
    :host { display: block; position: sticky; top: env(safe-area-inset-top, 0px); z-index: 50; }
    .row { display: flex; align-items: center; gap: 20px; }
    .topbar { background: var(--navy-deep); color: #dfe8fb; font-size: 13px; }
    .topbar .row { justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-block: 7px; }
    .topbar b { color: var(--sun); }
    .contacts { display: flex; gap: 16px; flex-wrap: wrap; }
    .bar { background: var(--surface); border-bottom: 1px solid var(--line); }
    .bar .row { padding-block: 12px; }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .mark { width: 50px; height: 50px; border-radius: 50%; background: #fff; flex-shrink: 0; box-shadow: 0 0 0 2px var(--sun); transition: transform .2s ease; }
    .brand:hover .mark { transform: rotate(-8deg) scale(1.05); }
    .wordmark { font-family: var(--font-display); font-weight: 800; font-size: 26px; line-height: 1; }
    .h { color: var(--sun-text); } .c { color: var(--sky); }
    small { display: block; font-size: 11.5px; color: var(--muted); font-weight: 700; letter-spacing: .04em; }
    nav { display: flex; gap: 4px; margin-left: auto; }
    nav a { padding: 8px 12px; border-radius: 999px; font-weight: 700; font-size: 15px; text-decoration: none; color: var(--ink-2); }
    nav a:hover { background: var(--surface-2); }
    .cart-btn { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 999px; background: var(--navy); color: #fff; font-weight: 800; text-decoration: none; }
    .count { min-width: 22px; height: 22px; border-radius: 999px; background: var(--sun); color: var(--sun-ink); font-size: 12.5px; display: grid; place-items: center; padding: 0 6px; }
    .menu-btn { display: none; width: 44px; height: 44px; border: 0; border-radius: 12px; background: var(--surface-2); color: var(--ink); place-items: center; }
    @media (max-width: 900px) {
      .topbar .contacts { display: none; }
      .cart-btn { margin-left: auto; }
      .menu-btn { display: grid; }
      nav { display: none; position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; gap: 0; margin: 0; background: var(--surface); border-bottom: 1px solid var(--line); padding: 8px max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px)); box-shadow: var(--shadow); }
      nav.open { display: flex; }
      nav a { padding: 12px; border-radius: 12px; }
      .bar { position: relative; }
      .wordmark { font-size: 22px; }
      small { display: none; }
      .bar .row { gap: 10px; }
      .brand { min-width: 0; }
    }
    @media (max-width: 420px) { .lbl { display: none; } .cart-btn { padding: 0 12px; } .mark { width: 42px; height: 42px; } }
  `,
})
export class Header {
  protected readonly cart = inject(CartService);
  protected readonly store = STORE;
  protected readonly minPrice = MIN_PRICE;
  protected readonly samePrice = SAME_PRICE;
  protected readonly unit = COMMON_UNIT;
  protected readonly menuOpen = signal(false);
}
