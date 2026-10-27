import { Component, input, output } from '@angular/core';
import { MAX_QTY } from '../services/cart.service';

@Component({
  selector: 'app-qty-stepper',
  template: `
    <button type="button" (click)="changed.emit(value() - 1)" [attr.aria-label]="'Fewer ' + label()">−</button>
    <input
      type="number"
      inputmode="numeric"
      min="0"
      [max]="max"
      [value]="value()"
      (change)="typed($any($event.target))"
      [attr.aria-label]="'Gallons of ' + label()"
    />
    <button type="button" (click)="changed.emit(value() + 1)" [attr.aria-label]="'More ' + label()">+</button>
  `,
  host: { '[class.sm]': 'small()' },
  styles: `
    :host { display: inline-flex; align-items: stretch; height: 44px; border-radius: 999px; box-shadow: inset 0 0 0 2px var(--line); overflow: hidden; background: var(--surface); }
    :host(.sm) { height: 36px; }
    button { width: 42px; border: 0; background: transparent; font-size: 20px; font-weight: 800; color: var(--ink); }
    :host(.sm) button { width: 34px; font-size: 17px; }
    button:hover { background: var(--surface-2); }
    input { width: 44px; border: 0; background: transparent; text-align: center; font: inherit; font-weight: 800; color: var(--ink); -moz-appearance: textfield; font-variant-numeric: tabular-nums; }
    :host(.sm) input { width: 36px; }
    input::-webkit-inner-spin-button, input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input:focus { outline: none; }
    :host(:focus-within) { box-shadow: inset 0 0 0 2px var(--sky); }
  `,
})
export class QtyStepper {
  readonly value = input.required<number>();
  readonly label = input('item');
  readonly small = input(false);
  readonly changed = output<number>();
  protected readonly max = MAX_QTY;

  typed(el: HTMLInputElement): void {
    const n = Math.floor(Number(el.value));
    const v = Number.isFinite(n) && n >= 0 ? Math.min(n, MAX_QTY) : 0;
    el.value = String(v);
    this.changed.emit(v);
  }
}
