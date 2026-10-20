import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { LucideCalendarDays, LucidePlus } from '@lucide/angular';
import { AlertService } from '../../../../core/services/alert.service';
import { ConcertsStore } from '../../../../core/stores/concerts.store';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { Concert } from '../../../../core/models/concert.model';
import { Performance } from '../../../../core/models/performance.model';
import { PerformancesStore } from '../../../../core/stores/performances.store';
import { PerformanceGrid } from '../../components/performance-grid/performance-grid';

@Component({
  selector: 'app-performances-admin',
  standalone: true,
  imports: [RouterLink, SkeletonLoader, ErrorState, PerformanceGrid, LucideCalendarDays, LucidePlus],
  template: `
    <section class="admin-content">
      <div class="admin-page-heading">
        <div><p class="eyebrow">CALENDARIO</p><h1>Sesiones</h1><p class="heading-copy">Consulta y gestiona las fechas, salas y precios de cada concierto.</p></div>
        <a class="primary-action" routerLink="/performances/create"><svg lucidePlus [size]="17"></svg> Nueva sesión</a>
      </div>
      <section class="table-panel">
        @if (store.error()) { <app-error-state [message]="store.error() ?? ''" (retry)="load()" /> }
        @if (store.loading()) {
          <div class="skeleton-rows"><app-skeleton-loader [count]="6" /></div>
        } @else if (store.isEmpty()) {
          <div class="table-empty"><span class="empty-icon"><svg lucideCalendarDays [size]="23"></svg></span><strong>Aún no hay sesiones</strong><p>Crea la primera sesión para empezar.</p><a class="primary-action" routerLink="/performances/create"><svg lucidePlus [size]="16"></svg> Crear sesión</a></div>
        } @else {
          <app-performance-grid [performances]="sortedPerformances()" [concerts]="concerts()" [busy]="store.submitting()" (toggleActive)="toggle($event)" (deletePerformance)="remove($event)" />
        }
      </section>
    </section>
  `,
  styles: [`.admin-content{max-width:1500px;margin:auto;padding:31px 36px 48px}.admin-page-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:21px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.primary-action{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:9px;background:#0878f9;padding:11px 15px;color:white;text-decoration:none;font-size:12px;font-weight:700;box-shadow:0 6px 15px #0878f926}.primary-action:hover{background:#0669dc}.table-panel{border:1px solid #e5e9ef;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 3px 10px #18223206}.skeleton-rows{padding:16px}.table-empty{min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:48px;height:48px;margin-bottom:12px;display:grid;place-items:center;border-radius:15px;background:#eff6ff;color:#0878f9}.table-empty strong{font:700 15px 'Space Grotesk',sans-serif;color:#30394a}.table-empty p{margin:7px 0 16px;color:#8993a2;font-size:11px}.table-error{padding:11px 16px;background:#fff2f2;color:#a53c3c;font-size:11px}.table-error button{margin-left:8px;border:0;background:none;color:#0878f9;font-weight:700;cursor:pointer}@media(max-width:850px){.admin-content{padding:25px 18px 40px}}@media(max-width:520px){.admin-page-heading{align-items:flex-start;gap:9px}.admin-page-heading h1{font-size:25px}.primary-action{padding:10px;font-size:10px}}`]
})
export class PerformancesAdmin implements OnInit {
  readonly store = inject(PerformancesStore);
  private readonly concertsStore = inject(ConcertsStore);
  private readonly alerts = inject(AlertService);

  readonly concerts = this.concertsStore.concerts;
  readonly sortedPerformances = computed(() =>
    [...this.store.items()].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  );

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    await Promise.all([this.store.loadAll(), this.concertsStore.loadAll()]);
  }

  async toggle(performance: Performance): Promise<void> {
    const active = !performance.isActive;
    const changed = await this.store.toggleActive(performance);
    if (changed) await this.alerts.success(active ? 'Sesión activada' : 'Sesión desactivada', this.concertTitle(performance.concertId));
  }

  async remove(performance: Performance): Promise<void> {
    const confirmation = await this.alerts.confirm(
      '¿Eliminar sesión?',
      `«${this.concertTitle(performance.concertId)}» en ${performance.venue} (${performance.city}) desaparecerá de la tabla.`,
      'Eliminar'
    );
    if (!confirmation.isConfirmed) return;

    if (await this.store.remove(performance)) await this.alerts.success('Sesión eliminada', 'Se ha eliminado de la lista de administración.');
  }

  concertTitle(concertId: string): string {
    return this.concerts().find((concert) => concert._id === concertId)?.title ?? 'Concierto no encontrado';
  }
}
