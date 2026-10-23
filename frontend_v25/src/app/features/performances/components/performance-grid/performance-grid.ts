import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCalendarDays, LucideMapPin, LucidePencil, LucidePower, LucideTrash2 } from '@lucide/angular';
import { Concert } from '../../../../core/models/concert.model';
import { Performance, PerformanceStatus } from '../../../../core/models/performance.model';

@Component({
  selector: 'app-performance-grid',
  standalone: true,
  imports: [DatePipe, RouterLink, LucideCalendarDays, LucideMapPin, LucidePencil, LucidePower, LucideTrash2],
  template: `
    <div class="table-scroll"><table class="concert-table">
      <thead><tr><th>Concierto</th><th>Fecha</th><th>Sala</th><th>Aforo</th><th>Precio</th><th>Status</th><th>Activa</th><th>Acciones</th></tr></thead>
      <tbody>@for (performance of performances; track performance._id) {
        <tr [class.inactive-row]="!performance.isActive">
          <td><div class="concert-cell"><span class="concert-avatar"><svg lucideCalendarDays [size]="17"></svg></span><span><strong>{{ concertTitle(performance.concertId) }}</strong><small>{{ performance.slug }}</small></span></div></td>
          <td><span class="cell-with-icon"><svg lucideCalendarDays [size]="14"></svg>{{ performance.startsAt | date: 'dd/MM/yyyy HH:mm' }}</span></td>
          <td><span class="cell-with-icon"><svg lucideMapPin [size]="14"></svg>{{ performance.venue?.name ?? 'Sin sala' }}, {{ performance.city }}</span></td>
          <td>{{ performance.bookedParticipants }} / {{ performance.venue?.capacity ?? '—' }}</td>
          <td><span class="price-cell">{{ performance.price }} €</span></td>
          <td><span class="status-pill" [class.status-full]="performance.status === 'full'" [class.status-cancelled]="performance.status === 'cancelled'" [class.status-completed]="performance.status === 'completed'" [class.inactive-status]="!performance.isActive">{{ statusLabel(performance.status) }}</span></td>
          <td><span class="active-pill" [class.inactive]="!performance.isActive"><i></i>{{ performance.isActive ? 'Activa' : 'Inactiva' }}</span></td>
          <td><div class="row-actions">
            <a class="icon-action" [routerLink]="['/performances', performance._id, 'edit']" [attr.aria-label]="'Editar sesión de ' + concertTitle(performance.concertId)" title="Editar"><svg lucidePencil [size]="15"></svg></a>
            <button class="icon-action power-action" [class.power-off]="performance.isActive" (click)="toggleActive.emit(performance)" [disabled]="busy" [attr.aria-label]="performance.isActive ? 'Desactivar sesión' : 'Activar sesión'" [title]="performance.isActive ? 'Desactivar' : 'Activar'"><svg lucidePower [size]="15"></svg></button>
            <button class="icon-action delete-action" (click)="deletePerformance.emit(performance)" [disabled]="busy" aria-label="Eliminar sesión" title="Eliminar"><svg lucideTrash2 [size]="15"></svg></button>
          </div></td>
        </tr>
      }</tbody>
    </table></div>
    <div class="table-foot">{{ performances.length }} sesiones <span>Las borradas lógicamente quedan fuera de la tabla.</span></div>
  `,
  styles: [`.table-scroll{overflow:auto}.concert-table{width:100%;min-width:980px;border-collapse:collapse;text-align:left}.concert-table th{height:41px;background:#f8fafc;color:#748094;font-size:10px;font-weight:700;letter-spacing:.15px;white-space:nowrap}.concert-table th,.concert-table td{padding:0 14px}.concert-table tbody tr{height:63px;border-top:1px solid #edf0f4}.concert-table tbody tr:hover{background:#fbfcfe}.concert-table tbody tr.inactive-row{background:#f1f3f6}.concert-table tbody tr.inactive-row:hover{background:#e9edf2}.concert-table tbody tr.inactive-row td{color:#8992a0}.concert-table tbody tr.inactive-row .concert-cell strong{color:#717b8a}.concert-table tbody tr.inactive-row .concert-cell small{color:#a2a9b3}.concert-table tbody tr.inactive-row .cell-with-icon svg{color:#aab1bb}.concert-table tbody tr.inactive-row .concert-avatar{background:#e6e9ed;color:#8d96a2}.concert-table td{color:#4b5668;font-size:11px}.concert-cell{display:flex;align-items:center;gap:10px;min-width:178px}.concert-avatar{display:grid;place-items:center;width:35px;height:35px;flex:0 0 35px;border-radius:10px;background:#eaf3ff;color:#0878f9}.concert-cell>span:last-child{min-width:0;display:grid;gap:4px}.concert-cell strong{max-width:185px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#293345;font-size:11px}.concert-cell small{max-width:185px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9aa3b1;font-size:9px}.cell-with-icon{display:flex;align-items:center;gap:7px;white-space:nowrap;color:#667286}.cell-with-icon svg{flex:0 0 auto;color:#98a2b2}.price-cell{font-weight:700;white-space:nowrap}.status-pill{display:inline-flex;border-radius:99px;background:#e7f2ff;padding:5px 9px;color:#1769bd;font-size:9px;font-weight:700;white-space:nowrap}.status-full{background:#fff3df;color:#aa6c0c}.status-cancelled{background:#ffeded;color:#bd3f43}.status-completed{background:#f3e8ff;color:#7e22ce}.status-pill.inactive-status{background:#e5e8ec;color:#7c8490}.active-pill{display:inline-flex;align-items:center;gap:6px;color:#277b4c;font-size:10px;font-weight:600;white-space:nowrap}.active-pill i{width:7px;height:7px;border-radius:50%;background:#32aa68}.active-pill.inactive{color:#778195}.active-pill.inactive i{background:#aab2bf}.row-actions{display:flex;gap:5px}.icon-action{width:29px;height:29px;display:grid;place-items:center;border:1px solid #e3e8ee;border-radius:7px;background:white;color:#647084;cursor:pointer;transition:.15s}.icon-action:hover{border-color:#a5cafa;background:#f2f8ff;color:#0878f9}.icon-action.power-off{color:#b87517}.icon-action.power-off:hover{border-color:#f0d3a8;background:#fff8eb;color:#ac6a0d}.icon-action.delete-action{color:#b54e52}.icon-action.delete-action:hover{border-color:#ffc4c4;background:#fff3f3;color:#ce3339}.icon-action:disabled{opacity:.45;cursor:wait}.table-foot{display:flex;justify-content:space-between;gap:12px;padding:12px 17px;border-top:1px solid #edf0f4;color:#8892a2;font-size:10px}.table-foot span{color:#9ca5b1}@media(max-width:850px){.table-foot{flex-direction:column;gap:4px}}`]
})
export class PerformanceGrid {
  @Input() performances: Performance[] = [];
  @Input() concerts: Concert[] = [];
  @Input() busy = false;
  @Output() toggleActive = new EventEmitter<Performance>();
  @Output() deletePerformance = new EventEmitter<Performance>();

  concertTitle(concertId: string): string {
    return this.concerts.find((concert) => concert._id === concertId)?.title ?? 'Concierto no encontrado';
  }

  statusLabel(status: PerformanceStatus): string {
    return ({ scheduled: 'Programado', full: 'Completo', cancelled: 'Cancelado', completed: 'Finalizado' })[status];
  }
}
