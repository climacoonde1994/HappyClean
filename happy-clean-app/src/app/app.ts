import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <app-header />
    <main><router-outlet /></main>
    <app-footer />
    <div class="toast" [class.on]="toast.message()" role="status">{{ toast.message() }}</div>
  `,
  styles: `
    main { display: block; min-height: 60vh; }
    .toast { position: fixed; left: 50%; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%) translateY(20px); opacity: 0; background: var(--ink); color: var(--bg); padding: 10px 18px; border-radius: 999px; font-weight: 800; transition: all .25s ease; z-index: 70; pointer-events: none; max-width: calc(100% - 32px); text-align: center; }
    .toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }
  `,
})
export class App {
  protected readonly toast = inject(ToastService);
}
