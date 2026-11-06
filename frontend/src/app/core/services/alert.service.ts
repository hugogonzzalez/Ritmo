import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  async success(title: string, text?: string): Promise<void> {
    await Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#0878f9' });
  }

  async error(title: string, text: string): Promise<void> {
    await Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#0878f9' });
  }

  async confirm(title: string, text: string, confirmText = 'Confirmar'): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d64045',
      cancelButtonColor: '#64748b'
    });
  }
}
