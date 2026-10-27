import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal('');
  private timer?: ReturnType<typeof setTimeout>;

  show(text: string): void {
    this.message.set(text);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(''), 2200);
  }

  async copy(text: string, done = 'Copied'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.show(done);
    } catch {
      this.show('Copy is blocked here. Select the text and copy it manually.');
    }
  }
}
