import { Component } from '@angular/core';
import { NgxSpinnerComponent } from 'ngx-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgxSpinnerComponent],
  template: `<ngx-spinner name="admin-spinner" bdColor="rgba(12, 18, 30, .35)" color="#0878f9" type="ball-clip-rotate" [fullScreen]="true"><p class="text-white text-sm">Guardando cambios…</p></ngx-spinner>`
})
export class Loader {}
