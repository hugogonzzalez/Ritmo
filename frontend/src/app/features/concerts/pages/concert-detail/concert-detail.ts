import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConcertsStore } from '../../../../core/stores/concerts.store';
import { ConcertStatus } from '../../../../core/models/concert.model';

@Component({
  selector: 'app-concert-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <section class="admin-content detail-page">
      <a class="form-back" routerLink="/concerts">← Volver a conciertos</a>
      @if (store.loading()) { <p>Cargando concierto…</p> }
      @else if (store.selected(); as concert) {
        <header class="detail-heading"><div><p class="eyebrow">DETALLE DEL CONCIERTO</p><h1>{{ concert.title }}</h1><p>{{ concert.venue }}, {{ concert.city }}</p></div><a class="primary-action" [routerLink]="['/concerts', concert.slug, 'edit']">Editar concierto</a></header>
        <div class="detail-card"><dl><div><dt>Fecha</dt><dd>{{ concert.date | date:'EEEE d MMMM y, HH:mm':'':'es-ES' }}</dd></div><div><dt>Precio</dt><dd>{{ concert.price | number:'1.2-2':'es-ES' }} €</dd></div><div><dt>Status</dt><dd>{{ statusLabel() }}</dd></div><div><dt>Activo</dt><dd>{{ concert.isActive ? 'Sí' : 'No' }}</dd></div><div><dt>Slug</dt><dd>{{ concert.slug }}</dd></div><div><dt>Descripción</dt><dd>{{ concert.description || 'Sin descripción' }}</dd></div></dl></div>
      } @else { <div class="form-error-panel">{{ store.error() || 'Concierto no encontrado.' }}</div> }
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:30px 36px}.form-back{display:inline-block;margin-bottom:18px;color:#718096;text-decoration:none;font-size:11px}.detail-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.eyebrow{color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.4px}.detail-heading h1{margin:0;font:700 28px 'Space Grotesk',sans-serif}.detail-heading p:last-child{color:#778195;font-size:12px}.detail-card{padding:24px;background:white;border:1px solid #e6eaf0;border-radius:14px}.detail-card dl{display:grid;grid-template-columns:1fr 1fr;gap:20px}.detail-card dl div{min-width:0}.detail-card dt{color:#8b94a3;font-size:10px;font-weight:700;text-transform:uppercase}.detail-card dd{margin:6px 0 0;color:#30394a;font-size:13px;overflow-wrap:anywhere}.primary-action{padding:11px 15px;border-radius:8px;background:#0878f9;color:white;text-decoration:none;font-size:11px;font-weight:700}.form-error-panel{padding:14px;background:#fff4f4;border:1px solid #ffcaca;border-radius:9px;color:#9e3030;font-size:12px}@media(max-width:600px){.admin-content{padding:22px 16px}.detail-heading{align-items:flex-start;gap:8px}.detail-heading h1{font-size:23px}.detail-card dl{grid-template-columns:1fr}}`]
})
export class ConcertDetail implements OnInit {
  readonly store = inject(ConcertsStore);
  private readonly route = inject(ActivatedRoute);
  readonly slug = signal('');
  readonly statusLabel = computed(() => {
    const status = this.store.selected()?.status as ConcertStatus | undefined;
    return status ? ({ scheduled: 'Programado', full: 'Completo', cancelled: 'Cancelado', completed: 'Finalizado' })[status] : '';
  });
  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) { this.slug.set(slug); void this.store.loadBySlug(slug); }
  }
}
