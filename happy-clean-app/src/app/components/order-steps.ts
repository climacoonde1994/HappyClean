import { Component, input } from '@angular/core';

@Component({
  selector: 'app-order-steps',
  template: `
    <ol>
      @for (s of steps; track s; let i = $index) {
        <li [class.done]="i + 1 < current()" [class.current]="i + 1 === current()">
          <span class="n">{{ i + 1 < current() ? '✓' : i + 1 }}</span>{{ s }}
        </li>
      }
    </ol>
  `,
  styles: `
    ol { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; flex-wrap: wrap; }
    li { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; color: #9fb3dc; }
    li:not(:last-child)::after { content: ''; width: 28px; height: 2px; background: rgba(255,255,255,.2); margin-left: 4px; }
    .n { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 12.5px; border: 2px solid currentColor; }
    li.current { color: #fff; }
    li.current .n { background: var(--sun); border-color: var(--sun); color: var(--sun-ink); }
    li.done { color: #cfdbf5; }
    li.done .n { background: rgba(255,255,255,.14); border-color: transparent; }
    @media (max-width: 520px) {
      li:not(.current) { font-size: 0; gap: 0; }
      li:not(.current) .n { font-size: 12.5px; }
      li:not(:last-child)::after { width: 14px; }
    }
  `,
})
export class OrderSteps {
  readonly current = input(1);
  protected readonly steps = ['Choose products', 'Details & delivery', 'Order sent'];
}
