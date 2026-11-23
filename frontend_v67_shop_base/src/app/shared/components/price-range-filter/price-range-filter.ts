import { Component, OnInit, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';

export interface PriceRange {
  minPrice: number | null;
  maxPrice: number | null;
}

// Límites mientras llega el rango real desde el backend (o si falla la petición)
const FALLBACK_BOUNDS = { min: 0, max: 200 };

@Component({
  selector: 'app-price-range-filter',
  standalone: true,
  template: `
    <div class="flex w-full items-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 sm:w-auto"
         [class.h-8]="compact()" [class.h-11]="!compact()"
         [class.gap-2]="compact()" [class.gap-3]="!compact()"
         [class.px-3]="compact()" [class.px-4]="!compact()">
      <span class="font-medium text-gray-500" [class.text-xs]="compact()" [class.text-sm]="!compact()">Precio</span>

      <div class="relative h-5 shrink-0" [class.w-20]="compact()" [class.w-28]="!compact()">
        <div class="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200"></div>
        <div class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-500"
             [style.left.%]="percent(lo())"
             [style.right.%]="100 - percent(hi())"></div>

        <input type="range" class="price-range-input" aria-label="Precio mínimo"
               [min]="bounds().min" [max]="bounds().max" [step]="step()" [value]="lo()"
               (input)="onLowInput($event)" (change)="emit()" />
        <input type="range" class="price-range-input" aria-label="Precio máximo"
               [min]="bounds().min" [max]="bounds().max" [step]="step()" [value]="hi()"
               (input)="onHighInput($event)" (change)="emit()" />
      </div>

      <span class="min-w-[7.5rem] whitespace-nowrap text-right font-semibold text-gray-800" [class.text-xs]="compact()" [class.text-sm]="!compact()">{{ label() }}</span>
    </div>
  `,
  styles: `
    .price-range-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      background: transparent;
      appearance: none;
      -webkit-appearance: none;
      pointer-events: none;
    }
    .price-range-input::-webkit-slider-runnable-track { background: transparent; }
    .price-range-input::-moz-range-track { background: transparent; }
    .price-range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      pointer-events: auto;
      cursor: pointer;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #ffffff;
      border: 2px solid #3b82f6;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
      transition: transform 150ms ease;
    }
    .price-range-input::-webkit-slider-thumb:hover { transform: scale(1.1); }
    .price-range-input::-moz-range-thumb {
      pointer-events: auto;
      cursor: pointer;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #ffffff;
      border: 2px solid #3b82f6;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
    }
    .price-range-input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px rgb(59 130 246 / 0.35); }
    .price-range-input:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px rgb(59 130 246 / 0.35); }
  `
})
export class PriceRangeFilter implements OnInit {
  private readonly shopService = inject(ShopService);

  // Valores que llegan desde el store (null = sin límite)
  readonly minPrice = input<number | null>(null);
  readonly maxPrice = input<number | null>(null);
  // Versión más pequeña (la usa el panel de admin)
  readonly compact = input<boolean>(false);

  // Emite solo al soltar el cursor, para no pedir datos en cada movimiento
  readonly rangeChange = output<PriceRange>();

  // Límites reales: el precio más barato y el más caro de las sesiones próximas
  readonly bounds = signal(FALLBACK_BOUNDS);
  readonly step = computed(() => Math.max(1, Math.ceil((this.bounds().max - this.bounds().min) / 100)));

  // Valores que se ven mientras el usuario arrastra; se reinician si el store los limpia
  readonly lo = linkedSignal(() => this.minPrice() ?? this.bounds().min);
  readonly hi = linkedSignal(() => this.maxPrice() ?? this.bounds().max);

  readonly label = computed(() => {
    const { min, max } = this.bounds();
    const low = this.lo();
    const high = this.hi();
    if (low <= min && high >= max) return 'Todos los precios';
    if (low <= min) return `Hasta ${high} €`;
    if (high >= max) return `Desde ${low} €`;
    return `${low} € – ${high} €`;
  });

  ngOnInit(): void {
    this.shopService.getPriceRange()
      .then(response => {
        const range = response.data;
        if (!range) return;
        const min = Math.floor(range.min);
        // Si todas las sesiones cuestan lo mismo, la barra igualmente tiene un tramo válido
        const max = Math.max(Math.ceil(range.max), min + 1);
        this.bounds.set({ min, max });
      })
      .catch(() => {
        // Si falla, se queda el rango por defecto y el filtro sigue funcionando
      });
  }

  percent(value: number): number {
    const { min, max } = this.bounds();
    return ((value - min) / (max - min)) * 100;
  }

  onLowInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    // El cursor de mínimo nunca pasa del de máximo
    this.lo.set(Math.min(value, this.hi()));
  }

  onHighInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    // El cursor de máximo nunca baja del de mínimo
    this.hi.set(Math.max(value, this.lo()));
  }

  emit(): void {
    const { min, max } = this.bounds();
    // Un cursor en su extremo significa "sin límite" en ese lado
    const minPrice = this.lo() <= min ? null : this.lo();
    const maxPrice = this.hi() >= max ? null : this.hi();

    // Si no ha cambiado nada respecto a lo que ya hay aplicado, no se emite
    if (minPrice === this.minPrice() && maxPrice === this.maxPrice()) return;

    this.rangeChange.emit({ minPrice, maxPrice });
  }
}
