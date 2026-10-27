import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PRODUCTS } from '../data/products';
import { CartService } from '../services/cart.service';
import { OrderSteps } from '../components/order-steps';
import { QtyStepper } from '../components/qty-stepper';

@Component({
  selector: 'app-order',
  imports: [RouterLink, DecimalPipe, OrderSteps, QtyStepper],
  template: `
    <section class="page-head">
      <div class="wrap">
        <app-order-steps [current]="1" />
        <h1>Create an order</h1>
        <p>Choose your products and how many you need. You'll add your contact details and choose delivery or pick-up next.</p>
      </div>
    </section>

    <div class="wrap layout">
      <section aria-label="Products">
        <ul class="picker">
          @for (p of products; track p.id) {
            @let q = cart.qtyOf(p.id);
            <li [class.selected]="q">
              <span class="thumb tint" [style.--tint]="p.color"><img [src]="p.image" alt="" /></span>
              <span class="info">
                <strong>{{ p.name }}</strong>
                <span>{{ p.scent }} · {{ p.size }}{{ p.inStock ? '' : ' · Out of stock' }}</span>
              </span>
              <span class="price num">₱{{ p.price | number }}<small>/{{ p.unit }}</small></span>
              <span class="qty">
                @if (!p.inStock) {
                  <span class="oos">Out of stock</span>
                } @else if (q) {
                  <app-qty-stepper [value]="q" [label]="p.scent" (changed)="cart.setQty(p.id, $event)" />
                } @else {
                  <button class="add" type="button" (click)="cart.add(p.id)" [attr.aria-label]="'Add ' + p.scent">Add</button>
                }
              </span>
            </li>
          }
        </ul>
        <p class="note">Ordering 20 or more, or want to resell? Mention it in the notes on the next step and we'll get back to you with bulk pricing.</p>
      </section>

      <aside class="summary" aria-label="Your order">
        <div class="panel">
          <header>
            <h2>Your order</h2>
            @if (cart.totalQty()) {
              <button class="link" type="button" (click)="cart.clear()">Clear all</button>
            }
          </header>
          @if (cart.lines().length) {
            <ul class="lines">
              @for (l of cart.lines(); track l.productId) {
                <li>
                  <div class="l-info"><strong>{{ l.name }}</strong><span>{{ l.scent }} · ₱{{ l.unitPrice | number }}/{{ l.unit }}</span></div>
                  <div class="l-row">
                    <app-qty-stepper [value]="l.quantity" [label]="l.scent" [small]="true" (changed)="cart.setQty(l.productId, $event)" />
                    <span class="l-total num">₱{{ l.lineTotal | number }}</span>
                    <button class="remove" type="button" (click)="cart.setQty(l.productId, 0)" [attr.aria-label]="'Remove ' + l.scent">×</button>
                  </div>
                </li>
              }
            </ul>
            <dl class="totals">
              <div><dt>Subtotal ({{ cart.totalQty() }} item{{ cart.totalQty() > 1 ? 's' : '' }})</dt><dd class="num">₱{{ cart.subtotal() | number }}</dd></div>
              <div class="muted"><dt>Delivery fee</dt><dd>We confirm by text</dd></div>
            </dl>
            <div class="go"><a class="btn btn-sun block" routerLink="/checkout">Continue to details →</a></div>
          } @else {
            <div class="empty"><strong>No items yet.</strong>Tap <em>Add</em> on a product to start your order.</div>
          }
        </div>
      </aside>
    </div>

    @if (cart.totalQty()) {
      <div class="mobile-bar">
        <span><b class="num">{{ cart.totalQty() }}</b> item{{ cart.totalQty() > 1 ? 's' : '' }} · <span class="num">₱{{ cart.subtotal() | number }}</span></span>
        <a class="btn btn-sun" routerLink="/checkout">Continue →</a>
      </div>
    }
  `,
  styles: `
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 28px; align-items: start; padding-block: 28px 72px; }
    .picker { list-style: none; margin: 0; padding: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 22px; overflow: hidden; box-shadow: var(--shadow); }
    .picker li { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto 140px; gap: 16px; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line); }
    .picker li:last-child { border-bottom: 0; }
    .picker li.selected { background: var(--sun-soft); }
    .thumb { width: 64px; height: 76px; border-radius: 14px; display: grid; place-items: center; overflow: hidden; }
    .thumb img { height: 68px; width: auto; }
    .info { min-width: 0; }
    .info strong { display: block; font-size: 16px; font-weight: 800; }
    .info span { color: var(--muted); font-size: 14px; }
    .price { font-weight: 800; white-space: nowrap; font-size: 17px; }
    .price small { color: var(--muted); font-weight: 600; font-size: 13px; }
    .qty { display: flex; justify-content: flex-end; }
    .add { height: 44px; padding: 0 22px; border-radius: 999px; border: 2px solid var(--navy); background: var(--surface); font-weight: 800; color: var(--ink); }
    .oos { font-weight: 800; color: var(--muted); font-size: 14px; }
    .add:hover { background: var(--navy); color: #fff; }
    .note { margin-top: 14px; color: var(--muted); font-size: 14px; }
    .summary { position: sticky; top: 130px; }
    .link { border: 0; background: none; color: var(--danger); font-weight: 800; font-size: 14px; padding: 6px; }
    .lines { list-style: none; margin: 0; padding: 0 22px; }
    .lines li { padding: 14px 0; border-bottom: 1px solid var(--line); }
    .lines li:last-child { border-bottom: 0; }
    .l-info strong { display: block; font-weight: 800; }
    .l-info span { font-size: 13px; color: var(--muted); }
    .l-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .l-total { margin-left: auto; font-weight: 800; }
    .remove { border: 0; background: none; color: var(--muted); font-size: 22px; width: 32px; height: 32px; border-radius: 8px; }
    .remove:hover { color: var(--danger); background: var(--surface-2); }
    .totals { margin: 0; padding: 14px 22px; border-top: 1px solid var(--line); background: var(--surface-2); }
    .totals div { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; align-items: baseline; }
    .totals dd { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 26px; }
    .totals .muted dd { font-family: var(--font-body); font-size: 13px; font-weight: 700; color: var(--muted); }
    .go { padding: 16px 22px 20px; }
    .empty { padding: 24px 22px 28px; color: var(--muted); }
    .empty strong { display: block; color: var(--ink); }
    .mobile-bar { display: none; }
    @media (max-width: 980px) {
      .layout { grid-template-columns: minmax(0, 1fr); padding-bottom: 100px; }
      .summary { position: static; }
      .mobile-bar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; justify-content: space-between; align-items: center; gap: 12px; padding: 10px max(16px, env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); background: var(--navy-deep); color: #fff; box-shadow: 0 -8px 24px rgba(0, 0, 0, .2); }
      .mobile-bar b { color: var(--sun); }
    }
    @media (max-width: 600px) {
      .picker li { grid-template-columns: 56px minmax(0, 1fr) auto; row-gap: 10px; }
      .thumb { width: 56px; height: 66px; } .thumb img { height: 58px; }
      .qty { grid-column: 1 / -1; justify-content: flex-start; }
    }
  `,
})
export class Order {
  protected readonly cart = inject(CartService);
  protected readonly products = PRODUCTS;
}
