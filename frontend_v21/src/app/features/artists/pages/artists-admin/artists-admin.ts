import { AlertService } from '../../../../core/services/alert.service';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideMusic, LucidePencil, LucidePlus, LucidePower, LucideTrash2 } from '@lucide/angular';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { Artist, ArtistPayload } from '../../../../core/models/artist.model';
import { ArtistService } from '../../../../core/services/artist.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ArtistsStore } from '../../../../core/stores/artists.store';

@Component({
  selector: 'app-artists-admin',
  standalone: true,
  imports: [RouterLink, ErrorState, SkeletonLoader, LucideMusic, LucidePencil, LucidePlus, LucidePower, LucideTrash2],
  template: `
    <section class="admin-content">
      <div class="admin-page-heading">
        <div><p class="eyebrow">CATÁLOGO</p><h1>Artistas</h1><p class="heading-copy">Consulta y gestiona los artistas de Ritmo.</p></div>
        <a class="primary-action" routerLink="/artists/create"><svg lucidePlus [size]="17"></svg> Nuevo artista</a>
      </div>
      <section class="table-panel">
        @if (error()) { <app-error-state [message]="error() ?? ''" (retry)="load()" /> }
        @if (loading()) {
          <div class="skeleton-rows"><app-skeleton-loader [count]="6" /></div>
        } @else if (artists().length === 0) {
          <div class="table-empty"><span class="empty-icon"><svg lucideMusic [size]="23"></svg></span><strong>Aún no hay artistas</strong><p>Crea el primer artista para empezar.</p><a class="primary-action" routerLink="/artists/create"><svg lucidePlus [size]="16"></svg> Crear artista</a></div>
        } @else {
          <div class="table-scroll"><table class="artist-table">
            <thead><tr><th>Artista</th><th>Redes</th><th>Imágenes</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>@for (artist of sortedArtists(); track artist._id) {
              <tr [class.inactive-row]="!artist.isActive">
                <td><div class="artist-cell"><span class="artist-avatar"><svg lucideMusic [size]="17"></svg></span><span><strong>{{ artist.name }}</strong><small>{{ artist.slug }}</small></span></div></td>
                <td>{{ artist.socials.length }}</td>
                <td>{{ artist.images.length }}</td>
                <td><span class="active-pill" [class.inactive]="!artist.isActive"><i></i>{{ artist.isActive ? 'Activo' : 'Inactivo' }}</span></td>
                <td><div class="row-actions">
                  <a class="icon-action" [routerLink]="['/artists', artist._id, 'edit']" [attr.aria-label]="'Editar ' + artist.name" title="Editar"><svg lucidePencil [size]="15"></svg></a>
                  <button class="icon-action power-action" [class.power-off]="artist.isActive" (click)="toggle(artist)" [disabled]="busy()" [attr.aria-label]="artist.isActive ? 'Desactivar ' + artist.name : 'Activar ' + artist.name" [title]="artist.isActive ? 'Desactivar' : 'Activar'"><svg lucidePower [size]="15"></svg></button>
                  <button class="icon-action delete-action" (click)="remove(artist)" [disabled]="busy()" [attr.aria-label]="'Eliminar ' + artist.name" title="Eliminar"><svg lucideTrash2 [size]="15"></svg></button>
                </div></td>
              </tr>
            }</tbody>
          </table></div>
          <div class="table-foot">{{ artists().length }} artistas <span>Los borrados lógicamente quedan fuera de la tabla.</span></div>
        }
      </section>
    </section>
  `,
  styles: [`.admin-content{max-width:1500px;margin:auto;padding:31px 36px 48px}.admin-page-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:21px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.primary-action{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:9px;background:#0878f9;padding:11px 15px;color:white;text-decoration:none;font-size:12px;font-weight:700;box-shadow:0 6px 15px #0878f926}.primary-action:hover{background:#0669dc}.table-panel{border:1px solid #e5e9ef;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 3px 10px #18223206}.table-scroll{overflow:auto}.artist-table{width:100%;min-width:760px;border-collapse:collapse;text-align:left}.artist-table th{height:41px;background:#f8fafc;color:#748094;font-size:10px;font-weight:700;white-space:nowrap}.artist-table th,.artist-table td{padding:0 14px}.artist-table tbody tr{height:63px;border-top:1px solid #edf0f4}.artist-table tbody tr:hover{background:#fbfcfe}.artist-table tbody tr.inactive-row{background:#f1f3f6}.artist-table td{color:#4b5668;font-size:11px}.artist-cell{display:flex;align-items:center;gap:10px;min-width:178px}.artist-avatar{display:grid;place-items:center;width:35px;height:35px;flex:0 0 35px;border-radius:10px;background:#eaf3ff;color:#0878f9}.artist-cell>span:last-child{display:grid;gap:4px}.artist-cell strong{color:#293345;font-size:11px}.artist-cell small{color:#9aa3b1;font-size:9px}.active-pill{display:inline-flex;align-items:center;gap:6px;color:#277b4c;font-size:10px;font-weight:600;white-space:nowrap}.active-pill i{width:7px;height:7px;border-radius:50%;background:#32aa68}.active-pill.inactive{color:#778195}.active-pill.inactive i{background:#aab2bf}.row-actions{display:flex;gap:5px}.icon-action{width:29px;height:29px;display:grid;place-items:center;border:1px solid #e3e8ee;border-radius:7px;background:white;color:#647084;cursor:pointer;transition:.15s}.icon-action:hover{border-color:#a5cafa;background:#f2f8ff;color:#0878f9}.icon-action.power-off{color:#b87517}.icon-action.delete-action{color:#b54e52}.icon-action.delete-action:hover{border-color:#ffc4c4;background:#fff3f3;color:#ce3339}.icon-action:disabled{opacity:.45;cursor:wait}.table-foot{display:flex;justify-content:space-between;gap:12px;padding:12px 17px;border-top:1px solid #edf0f4;color:#8892a2;font-size:10px}.table-foot span{color:#9ca5b1}.skeleton-rows{padding:16px}.table-empty{min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:48px;height:48px;margin-bottom:12px;display:grid;place-items:center;border-radius:15px;background:#eff6ff;color:#0878f9}.table-empty strong{font:700 15px 'Space Grotesk',sans-serif;color:#30394a}.table-empty p{margin:7px 0 16px;color:#8993a2;font-size:11px}@media(max-width:850px){.admin-content{padding:25px 18px 40px}}`]
})
export class ArtistsAdmin implements OnInit {
  readonly store = inject(ArtistsStore);
  private readonly artistService = inject(ArtistService);
  private readonly alerts = inject(AlertService);
  readonly artists = this.store.artists;
  readonly loading = this.store.loading;
  readonly busy = this.store.saving;
  readonly error = this.store.error;
  readonly sortedArtists = computed(() => [...this.artists()].sort((a, b) => a.name.localeCompare(b.name)));

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const response = await this.artistService.getAll({ includeInactive: true });
      this.store.setItems(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar artistas.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async toggle(artist: Artist): Promise<void> {
    const active = !artist.isActive;
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.artistService.setActivation(artist._id, active);
      this.store.upsert(response.data);
      await this.alerts.success(active ? 'Artista activado' : 'Artista desactivado', artist.name);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  async remove(artist: Artist): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar artista?', `«${artist.name}» desaparecerá de la tabla.`, 'Eliminar');
    if (!confirmation.isConfirmed) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      await this.artistService.softDelete(artist._id);
      this.store.remove(artist._id);
      await this.alerts.success('Artista eliminado', 'Se ha eliminado de la lista de administración.');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se pudo eliminar el artista.'));
    } finally {
      this.store.setSaving(false);
    }
  }
}
