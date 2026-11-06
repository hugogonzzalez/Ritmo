import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConcertStatus } from '../../../../core/models/concert.model';
import { ConcertService } from '../../../../core/services/concert.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ConcertsStore } from '../../../../core/stores/concerts.store';

@Component({
  selector: 'app-concert-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="admin-content detail-page">
      <a class="form-back" routerLink="/concerts">← Volver a conciertos</a>
      @if (store.loading()) { <p>Cargando concierto…</p> }
      @else if (store.selected(); as concert) {
        <header class="detail-heading"><div><p class="eyebrow">DETALLE DEL CONCIERTO</p><h1>{{ concert.title }}</h1><p>{{ concert.slug }}</p></div><a class="primary-action" [routerLink]="['/concerts', concert._id, 'edit']">Editar concierto</a></header>
        <div class="detail-card"><dl><div><dt>Status</dt><dd>{{ statusLabel() }}</dd></div><div><dt>Activo</dt><dd>{{ concert.isActive ? 'Sí' : 'No' }}</dd></div><div><dt>Slug</dt><dd>{{ concert.slug }}</dd></div><div><dt>Categoría</dt><dd>{{ concert.categories.length ? concert.categories[0].name : 'Sin categoría' }}</dd></div><div><dt>Descripción</dt><dd>{{ concert.description || 'Sin descripción' }}</dd></div></dl></div>
      } @else { <div class="form-error-panel">{{ store.error() || 'Concierto no encontrado.' }}</div> }
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:30px 36px}.form-back{display:inline-block;margin-bottom:18px;color:#718096;text-decoration:none;font-size:11px}.detail-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.eyebrow{color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.4px}.detail-heading h1{margin:0;font:700 28px 'Space Grotesk',sans-serif}.detail-heading p:last-child{color:#778195;font-size:12px}.detail-card{padding:24px;background:white;border:1px solid #e6eaf0;border-radius:14px}.detail-card dl{display:grid;grid-template-columns:1fr 1fr;gap:20px}.detail-card dl div{min-width:0}.detail-card dt{color:#8b94a3;font-size:10px;font-weight:700;text-transform:uppercase}.detail-card dd{margin:6px 0 0;color:#30394a;font-size:13px;overflow-wrap:anywhere}.primary-action{padding:11px 15px;border-radius:8px;background:#0878f9;color:white;text-decoration:none;font-size:11px;font-weight:700}.form-error-panel{padding:14px;background:#fff4f4;border:1px solid #ffcaca;border-radius:9px;color:#9e3030;font-size:12px}@media(max-width:600px){.admin-content{padding:22px 16px}.detail-heading{align-items:flex-start;gap:8px}.detail-heading h1{font-size:23px}.detail-card dl{grid-template-columns:1fr}}`]
})
export class ConcertDetail implements OnInit {
  readonly store = inject(ConcertsStore);
  private readonly concertService = inject(ConcertService);
  private readonly route = inject(ActivatedRoute);
  readonly statusLabel = computed(() => {
    const status = this.store.selected()?.status as ConcertStatus | undefined;
    return status ? ({ scheduled: 'Programado', full: 'Completo', cancelled: 'Cancelado', completed: 'Finalizado' })[status] : '';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.load(id);
  }

  async load(id: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    this.store.setSelected(null);
    try {
      const response = await this.concertService.getById(id);
      this.store.setSelected(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha encontrado el concierto.'));
    } finally {
      this.store.setLoading(false);
    }
  }
}
