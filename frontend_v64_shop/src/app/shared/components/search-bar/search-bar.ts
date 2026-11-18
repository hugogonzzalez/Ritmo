import { Component, OnDestroy, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="relative">
      <svg class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400"
           [class.left-5]="!compact()" [class.w-5]="!compact()" [class.h-5]="!compact()"
           [class.left-3]="compact()" [class.w-4]="compact()" [class.h-4]="compact()"
           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="search"
        [placeholder]="placeholder()"
        [(ngModel)]="text"
        (ngModelChange)="onInput($event)"
        class="w-full rounded-xl border border-gray-200 bg-white pr-4 text-gray-800 placeholder-gray-400 shadow-sm transition hover:border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        [class.h-12]="!compact()" [class.h-9]="compact()"
        [class.pl-12]="!compact()" [class.pl-9]="compact()"
        [class.text-base]="!compact()" [class.text-sm]="compact()"
      />
    </div>
  `
})
export class SearchBar implements OnDestroy {
  readonly placeholder = input<string>('Buscar conciertos…');
  readonly value = input<string>('');
  // Versión más pequeña (la usa el panel de admin)
  readonly compact = input<boolean>(false);
  // Emite el texto ya con debounce, para no lanzar una petición por cada tecla
  readonly searchChange = output<string>();

  text = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Al limpiar filtros desde fuera, el texto del buscador también se borra
    effect(() => {
      if (this.value() === '' && this.text !== '') {
        this.text = '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  onInput(value: string): void {
    this.text = value;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.searchChange.emit(value), 350);
  }

  clear(): void {
    this.text = '';
    if (this.timer) clearTimeout(this.timer);
    this.searchChange.emit('');
  }
}
