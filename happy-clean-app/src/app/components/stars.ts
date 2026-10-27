import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stars',
  template: `
    <span class="stars" role="img" [attr.aria-label]="value().toFixed(1) + ' out of 5 stars'">
      @for (i of five; track i) {
        <svg [class.off]="i > rounded()" [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
        </svg>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; vertical-align: middle; }
    .stars { display: inline-flex; gap: 2px; color: var(--star); }
    svg { display: block; }
    .off { color: var(--line); }
  `,
})
export class Stars {
  readonly value = input(0);
  readonly size = input(16);
  protected readonly five = [1, 2, 3, 4, 5];
  protected readonly rounded = computed(() => Math.round(this.value()));
}
