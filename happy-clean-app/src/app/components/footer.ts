import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STORE } from '../data/store';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer>
      <div class="wrap row">
        <a class="wordmark" routerLink="/"><span class="h">Happy</span>&nbsp;<span class="c">Clean</span></a>
        <span class="by"><img src="images/hco.webp" alt="HCO Business Solutions logo" width="44" height="44" /><span>A product of <b>{{ store.company }}</b></span></span>
        <span>© {{ year }} {{ store.name }}. Prices in Philippine pesos and may change without notice.</span>
      </div>
    </footer>
  `,
  styles: `
    footer { padding-block: 32px 40px; color: var(--muted); font-size: 14px; border-top: 1px solid var(--line); background: var(--surface); }
    .row { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .wordmark { font-family: var(--font-display); font-weight: 800; font-size: 22px; text-decoration: none; }
    .h { color: var(--sun-text); } .c { color: var(--sky); }
    .by { display: flex; align-items: center; gap: 10px; }
    .by b { color: var(--ink); }
  `,
})
export class Footer {
  protected readonly store = STORE;
  protected readonly year = new Date().getFullYear();
}
