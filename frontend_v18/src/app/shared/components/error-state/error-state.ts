import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `<section class="error-state" role="alert"><p>{{ message }}</p><button type="button" (click)="retry.emit()">Reintentar</button></section>`,
  styles: [`.error-state{padding:16px;border:1px solid #ffcaca;border-radius:10px;background:#fff4f4;color:#9e3030;font-size:12px}.error-state p{margin:0 0 8px}.error-state button{border:0;background:transparent;color:#0878f9;font-weight:700;cursor:pointer}`]
})
export class ErrorState {
  @Input() message = 'No se han podido cargar los datos.';
  @Output() retry = new EventEmitter<void>();
}
