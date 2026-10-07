import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `
    <div class="skeleton-grid" aria-label="Cargando contenido" aria-busy="true">
      @for (item of items(); track $index) {
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-line line-long"></div>
          <div class="skeleton-line line-medium"></div>
          <div class="skeleton-line line-short"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}
    .skeleton-card{padding:14px;border:1px solid #e7ebf1;border-radius:12px;background:#fff}
    .skeleton-image,.skeleton-line{background:linear-gradient(90deg,#edf0f4,#f8f9fb,#edf0f4);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
    .skeleton-image{height:150px;margin-bottom:15px}.skeleton-line{height:12px;margin:10px 0}.line-long{width:78%}.line-medium{width:58%}.line-short{width:38%}
    @keyframes shimmer{to{background-position:-200% 0}}
    @media(prefers-reduced-motion:reduce){.skeleton-image,.skeleton-line{animation:none}}
  `]
})
export class SkeletonLoader {
  readonly count = input(8);
  readonly items = computed(() => Array(this.count()).fill(0));
}
