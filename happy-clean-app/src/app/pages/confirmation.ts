import { Component, computed, inject, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService, PAY_LABELS, TIME_LABELS } from '../services/order.service';
import { ToastService } from '../services/toast.service';
import { STORE } from '../data/store';
import { OrderSteps } from '../components/order-steps';

@Component({
  selector: 'app-confirmation',
  imports: [RouterLink, DatePipe, DecimalPipe, OrderSteps],
  template: `
    <section class="page-head"><div class="wrap"><app-order-steps [current]="3" /></div></section>
    <div class="wrap page">
      @if (order(); as o) {
        <div class="hero-card panel">
          <div class="check" [class.wait]="!o.sent" aria-hidden="true">
            @if (o.sent) {
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            } @else {
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>
            }
          </div>
          <div>
            @if (o.sent) {
              <h1>Order sent</h1>
              <p>Thank you, {{ o.request.customer.name }}. We received your order and will text <strong>{{ o.request.customer.mobile }}</strong> to confirm it.</p>
            } @else {
              <h1>One more step</h1>
              <p>Your order is ready, {{ o.request.customer.name }}. Send it to us by text, email or Facebook so we can confirm it.</p>
            }
          </div>
          <div class="order-no">
            <span>Order number</span>
            <strong>{{ o.orderNumber }}</strong>
            <em>{{ o.sent ? 'Awaiting confirmation' : 'Not sent yet' }}</em>
          </div>
        </div>

        @if (!o.sent) {
          <section class="panel send-box">
            <header><h2>Send your order</h2></header>
            <pre class="msg">{{ message() }}</pre>
            <div class="send">
              <button class="btn btn-sun" type="button" (click)="copy()">Copy order message</button>
              <a class="btn btn-navy" [href]="smsHref()">Text {{ store.mobileDisplay }}</a>
              <a class="btn btn-line" [href]="mailHref()">Email us</a>
            </div>
            <p class="hint">If the Text or Email button doesn't open an app, copy the message and send it to {{ store.mobileDisplay }}, {{ store.email }}, or our Facebook page {{ store.facebookName }}.</p>
          </section>
        }

        <div class="cols">
          <section class="panel receipt" aria-label="Order details">
            <header><h2>Order details</h2><span>{{ o.createdAt | date: 'MMM d, y, h:mm a' }}</span></header>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Price</th><th class="n">Total</th></tr></thead>
                <tbody>
                  @for (l of o.lines; track l.productId) {
                    <tr><td>{{ l.name }}</td><td class="n">{{ l.quantity }}</td><td class="n">₱{{ l.unitPrice | number }}</td><td class="n">₱{{ l.lineTotal | number }}</td></tr>
                  }
                </tbody>
                <tfoot>
                  <tr><td colspan="3">Subtotal</td><td class="n">₱{{ o.subtotal | number }}</td></tr>
                  @if (o.request.fulfillment === 'delivery') {
                    <tr class="muted"><td colspan="3">Delivery fee</td><td class="n">To be confirmed</td></tr>
                  }
                </tfoot>
              </table>
            </div>
          </section>

          <aside class="side">
            <section class="panel box">
              <h3>{{ o.request.fulfillment === 'delivery' ? 'Delivery' : 'Pick-up' }}</h3>
              @if (o.request.fulfillment === 'delivery' && o.request.address; as a) {
                <p>{{ a.street }}, {{ a.barangay }}<br />{{ a.city }}, {{ a.province }}</p>
                @if (a.landmark) { <p class="muted">Landmark: {{ a.landmark }}</p> }
              } @else {
                <p>We'll text you the pick-up location.</p>
              }
              <p><strong>{{ o.request.preferredDate | date: 'EEE, MMM d, y' }}</strong> · {{ times[o.request.preferredTime] }}</p>
              <p class="muted">Payment: {{ pays[o.request.paymentMethod] }}</p>
              @if (o.request.notes) { <p class="muted">Notes: {{ o.request.notes }}</p> }
            </section>
            <section class="panel box">
              <h3>What happens next</h3>
              <ol>
                <li>We check your order and stock.</li>
                <li>We text you to confirm the total{{ o.request.fulfillment === 'delivery' ? ', delivery fee' : '' }} and schedule.</li>
                <li>{{ o.request.fulfillment === 'delivery' ? 'We deliver to your address.' : 'You pick up your order.' }}</li>
              </ol>
            </section>
            <a class="btn btn-navy block" routerLink="/order">Start a new order</a>
            <p class="muted small">Questions? Call {{ store.mobileDisplay }} and give your order number.</p>
          </aside>
        </div>
      } @else {
        <div class="panel missing">
          <h1>Order not found</h1>
          <p>We couldn't find order {{ orderNumber() }} on this device. Call us at {{ store.mobileDisplay }} if you need help.</p>
          <a class="btn btn-sun" routerLink="/">Back to home</a>
        </div>
      }
    </div>
  `,
  styles: `
    .page-head { padding-block: 22px; }
    .page { padding-block: 28px 72px; display: grid; gap: 24px; }
    .hero-card { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 20px; align-items: center; padding: 24px; }
    .hero-card h1 { font-size: 42px; }
    .hero-card p { margin-top: 6px; color: var(--muted); }
    .check { width: 58px; height: 58px; border-radius: 50%; background: var(--ok); color: #fff; display: grid; place-items: center; }
    .check.wait { background: var(--sky); }
    .order-no { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; text-align: right; }
    .order-no span { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
    .order-no strong { font-family: var(--font-display); font-size: 28px; background: var(--sun); color: var(--sun-ink); padding: 2px 12px; border-radius: 8px; }
    .order-no em { font-style: normal; font-size: 12px; font-weight: 800; color: var(--ink-2); background: var(--sun-soft); padding: 3px 10px; border-radius: 999px; }
    .send-box .msg { margin: 18px 22px; border-radius: 14px; background: var(--bg); border: 2px dashed var(--line); padding: 14px 16px; font-size: 13.5px; white-space: pre-wrap; word-break: break-word; color: var(--ink-2); max-height: 280px; overflow: auto; }
    .send { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 22px 16px; }
    .hint { padding: 0 22px 20px; font-size: 13.5px; color: var(--muted); }
    .cols { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; }
    .receipt header span { font-size: 13px; color: var(--muted); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 15px; }
    th { text-align: left; font-size: 11.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); padding: 10px 22px; border-bottom: 1px solid var(--line); }
    td { padding: 12px 22px; border-bottom: 1px solid var(--line); }
    .n { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    tfoot td { background: var(--surface-2); font-weight: 800; border-bottom: 0; }
    tfoot .muted td { color: var(--muted); font-weight: 600; }
    .side { display: flex; flex-direction: column; gap: 14px; }
    .box { padding: 18px 20px; }
    .box h3 { font-size: 22px; margin-bottom: 8px; }
    .box p { margin: 0 0 6px; font-size: 15px; }
    .box ol { margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 15px; }
    .muted { color: var(--muted); }
    .small { font-size: 13.5px; }
    .missing { padding: 48px 24px; text-align: center; display: grid; gap: 12px; justify-items: center; }
    .missing h1 { font-size: 38px; }
    @media (max-width: 900px) {
      .cols { grid-template-columns: minmax(0, 1fr); }
      .hero-card { grid-template-columns: auto minmax(0, 1fr); }
      .order-no { grid-column: 1 / -1; align-items: flex-start; text-align: left; }
    }
    @media (max-width: 520px) { .hero-card h1 { font-size: 32px; } th, td { padding-left: 14px; padding-right: 14px; } }
  `,
})
export class Confirmation {
  readonly orderNumber = input.required<string>();
  private readonly orders = inject(OrderService);
  private readonly toast = inject(ToastService);
  protected readonly store = STORE;
  protected readonly times = TIME_LABELS;
  protected readonly pays = PAY_LABELS;

  protected readonly order = computed(() => this.orders.get(this.orderNumber()));
  protected readonly message = computed(() => {
    const o = this.order();
    return o ? this.orders.messageFor(o) : '';
  });
  protected readonly smsHref = computed(() => `sms:${STORE.mobile}?body=${encodeURIComponent(this.message())}`);
  protected readonly mailHref = computed(
    () => `mailto:${STORE.email}?subject=${encodeURIComponent('Happy Clean order ' + this.orderNumber())}&body=${encodeURIComponent(this.message())}`,
  );

  copy(): void {
    this.toast.copy(this.message(), 'Order message copied');
  }
}
