import { Injectable, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly spinner = inject(NgxSpinnerService);
  private pending = 0;

  show(): void {
    this.pending += 1;
    void this.spinner.show('admin-spinner');
  }

  hide(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) void this.spinner.hide('admin-spinner');
  }
}
