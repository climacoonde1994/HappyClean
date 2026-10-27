import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';
import { Fulfillment, OrderError, OrderRequest, OrderService, PAY_LABELS, TIME_LABELS } from '../services/order.service';
import { OrderSteps } from '../components/order-steps';

const PH_MOBILE = /^(\+?63|0)9\d{9}$/;

function phMobile(c: AbstractControl): ValidationErrors | null {
  const v = String(c.value ?? '').replace(/[\s-]/g, '');
  return !v || PH_MOBILE.test(v) ? null : { mobile: true };
}

function todayIso(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, OrderSteps],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  protected readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly minDate = todayIso();
  protected readonly timeLabels = TIME_LABELS;
  protected readonly payLabels = PAY_LABELS;
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly tried = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    mobile: ['', [Validators.required, phMobile]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    fulfillment: ['delivery' as Fulfillment],
    street: ['', Validators.maxLength(160)],
    barangay: ['', Validators.maxLength(80)],
    city: ['', Validators.maxLength(80)],
    province: ['', Validators.maxLength(80)],
    landmark: ['', Validators.maxLength(160)],
    preferredDate: [todayIso(), Validators.required],
    preferredTime: ['anytime' as keyof typeof TIME_LABELS],
    paymentMethod: ['cod' as keyof typeof PAY_LABELS],
    notes: ['', Validators.maxLength(500)],
    website: [''],
  });

  constructor() {
    this.applyFulfillment('delivery');
    this.form.controls.fulfillment.valueChanges.subscribe((v) => this.applyFulfillment(v));
  }

  protected setFulfillment(v: Fulfillment): void {
    this.form.controls.fulfillment.setValue(v);
  }

  private applyFulfillment(v: Fulfillment): void {
    const required = v === 'delivery' ? [Validators.required, Validators.maxLength(160)] : [Validators.maxLength(160)];
    for (const key of ['street', 'barangay', 'city', 'province'] as const) {
      this.form.controls[key].setValidators(required);
      this.form.controls[key].updateValueAndValidity({ emitEvent: false });
    }
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.tried());
  }

  async submit(): Promise<void> {
    this.tried.set(true);
    this.error.set('');
    if (!this.cart.lines().length) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => document.querySelector<HTMLElement>('.field.invalid input, .field.invalid select')?.focus());
      return;
    }
    if (this.form.controls.preferredDate.value < this.minDate) {
      this.error.set('Please pick today or a later date.');
      return;
    }

    const v = this.form.getRawValue();
    const request: OrderRequest = {
      items: this.cart.lines().map((l) => ({ productId: l.productId, quantity: l.quantity })),
      customer: { name: v.name.trim(), mobile: v.mobile.replace(/[\s-]/g, ''), email: v.email.trim() || undefined },
      fulfillment: v.fulfillment,
      address:
        v.fulfillment === 'delivery'
          ? { street: v.street.trim(), barangay: v.barangay.trim(), city: v.city.trim(), province: v.province.trim(), landmark: v.landmark.trim() || undefined }
          : undefined,
      preferredDate: v.preferredDate,
      preferredTime: v.preferredTime,
      paymentMethod: v.paymentMethod,
      notes: v.notes.trim() || undefined,
      website: v.website,
    };
    const lines = this.cart.lines().map((l) => ({
      productId: l.productId,
      name: `${l.name} (${l.scent})`,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    }));

    this.submitting.set(true);
    try {
      const record = await this.orders.submit(request, lines, this.cart.subtotal());
      this.cart.clear();
      await this.router.navigate(['/order', record.orderNumber]);
    } catch (err) {
      this.error.set(err instanceof OrderError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
