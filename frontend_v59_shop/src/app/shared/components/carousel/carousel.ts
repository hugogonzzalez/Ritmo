import { AfterViewInit, Component, ElementRef, OnDestroy, computed, contentChild, inject, input, signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="relative">
      <div class="overflow-hidden rounded-xl">
        <div class="flex transition-transform duration-300 ease-in-out"
             [style.gap.px]="gap()"
             [style.transform]="'translateX(-' + offset() + 'px)'">
          @for (item of items(); track $index) {
            <div class="flex-shrink-0" [style.width.px]="cardWidth()">
              <ng-container [ngTemplateOutlet]="itemTemplate()"
                            [ngTemplateOutletContext]="{ $implicit: item, index: $index }" />
            </div>
          }
        </div>
      </div>

      @if (canPrev()) {
        <button (click)="prev()" aria-label="Anterior"
                class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg">
          <svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      }
      @if (canNext()) {
        <button (click)="next()" aria-label="Siguiente"
                class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg">
          <svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      }
    </div>
  `
})
export class Carousel<T> implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly items = input.required<T[]>();
  readonly visibleCount = input<number>(4);
  readonly gap = input<number>(16);

  readonly itemTemplate = contentChild.required<TemplateRef<{ $implicit: T; index: number }>>('item');

  // Ancho real del contenedor, para que las tarjetas encajen en móvil y en escritorio
  private readonly containerWidth = signal(1200);
  private observer: ResizeObserver | null = null;
  private readonly index = signal(0);

  // En móvil se ve 1 tarjeta, en tablet 2 y en escritorio la cantidad pedida
  readonly visible = computed(() => {
    const width = this.containerWidth();
    if (width < 640) return 1;
    if (width < 1024) return Math.min(2, this.visibleCount());
    return this.visibleCount();
  });

  readonly cardWidth = computed(() => {
    const totalGap = this.gap() * (this.visible() - 1);
    return (this.containerWidth() - totalGap) / this.visible();
  });

  readonly offset = computed(() => this.index() * (this.cardWidth() + this.gap()));
  readonly canPrev = computed(() => this.index() > 0);
  readonly canNext = computed(() => this.index() + this.visible() < this.items().length);

  ngAfterViewInit(): void {
    this.containerWidth.set(this.host.nativeElement.clientWidth || 1200);
    this.observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) this.containerWidth.set(width);
    });
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  prev(): void {
    if (this.canPrev()) this.index.update(i => i - 1);
  }

  next(): void {
    if (this.canNext()) this.index.update(i => i + 1);
  }
}
