import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `<section class="empty-state"><strong>{{ title }}</strong><p>{{ message }}</p></section>`,
  styles: [`.empty-state{padding:36px 16px;text-align:center;color:#778195}.empty-state strong{color:#30394a;font:700 15px 'Space Grotesk',sans-serif}.empty-state p{font-size:11px}`]
})
export class EmptyState {
  @Input() title = 'No hay resultados';
  @Input() message = 'Prueba a cambiar los filtros.';
}
