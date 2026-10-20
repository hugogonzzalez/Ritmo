import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { LucideArrowLeft, LucideMapPin, LucideMusic } from '@lucide/angular';
import { AlertService } from '../../../../core/services/alert.service';
import { CONCERT_STATUSES, ConcertStatus } from '../../../../core/models/concert.model';
import { ConcertsStore } from '../../../../core/stores/concerts.store';
import { ArtistsStore } from '../../../../core/stores/artists.store';

@Component({
  selector: 'app-concert-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SkeletonLoader, ImageManager,
    LucideArrowLeft, LucideMapPin, LucideMusic],
  template: `
    <section class="admin-content form-page">
      <a class="form-back" routerLink="/concerts"><svg lucideArrowLeft [size]="16"></svg> Volver a conciertos</a>
      <div class="admin-page-heading form-heading">
        <div><p class="eyebrow">GESTIÓN DE CONCIERTOS</p><h1>{{ isEditMode() ? 'Editar concierto' : 'Nuevo concierto' }}</h1><p class="heading-copy">{{ isEditMode() ? 'Actualiza la información y el estado del evento.' : 'Completa los datos para añadirlo a la agenda.' }}</p></div>
      </div>
      @if (isEditMode() && store.loading()) {
        <app-skeleton-loader [count]="5" />
      } @else if (isEditMode() && !store.selected()) {
        <div class="form-error-panel" role="alert">{{ store.error() || 'No se ha podido cargar el concierto.' }}<a routerLink="/concerts">Volver al listado</a></div>
      } @else {
        <form class="concert-form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-section-title"><span class="form-icon"><svg lucideMusic [size]="18"></svg></span><div><h2>Información del concierto</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
          @if (store.error()) { <div class="form-error-panel" role="alert">{{ store.error() }}</div> }
          <div class="form-grid">
            <div class="form-field full"><label for="title">Nombre del concierto <b>*</b></label><input id="title" formControlName="title" maxlength="120" placeholder="Ej. Festival de verano">@if (fieldError('title')) { <small class="field-error">Escribe un nombre de entre 1 y 120 caracteres.</small> }</div>
            <div class="form-field full"><label for="description">Descripción</label><textarea id="description" rows="4" maxlength="500" formControlName="description" placeholder="Información adicional sobre el concierto (opcional)"></textarea><small class="field-hint">{{ form.controls.description.value.length }}/500 caracteres</small></div>
          </div>
          <div class="form-section-title status-section"><span class="form-icon"><svg lucideMusic [size]="18"></svg></span><div><h2>Artistas</h2><p>Artistas que actúan en este concierto.</p></div></div>
          <div class="form-grid"><div class="form-field full"><div class="artist-picks">@for (artist of artistsStore.artists(); track artist._id) { <label class="artist-pick"><input type="checkbox" [checked]="hasArtist(artist._id)" (change)="toggleArtist(artist._id)"><span>{{ artist.name }}</span>@if (!artist.isActive) { <small>(inactivo)</small> }</label> } @empty { <small class="artist-empty">{{ artistsStore.error() ?? 'Aún no hay artistas. Créalos en la sección Artistas.' }}</small> }</div></div></div>
          <div class="form-section-title status-section"><span class="form-icon status-icon"><svg lucideMapPin [size]="18"></svg></span><div><h2>Publicación y estado</h2><p>Controla si el concierto está visible y en qué situación se encuentra.</p></div></div>
          <div class="form-grid status-grid">
            <div class="form-field"><label for="status">Status del concierto</label><select id="status" formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusLabel(status) }}</option> }</select></div>
            <label class="active-control" for="isActive"><span class="switch-copy"><strong>Concierto activo</strong><small>{{ form.controls.isActive.value ? 'Visible en la web pública' : 'Oculto en la web pública' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>
          </div>
          <div class="form-actions"><a routerLink="/concerts" class="secondary-action">Cancelar</a><button type="submit" class="primary-action" [disabled]="store.saving()"><svg lucideMusic [size]="16"></svg>{{ store.saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear concierto') }}</button></div>
        </form>
        @if (isEditMode() && store.selected(); as current) {
          <app-image-manager ownerType="concert" [ownerId]="current._id" />
        }
      }
    </section>
  `,
  styles: [`.artist-picks{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}.artist-pick{box-sizing:border-box;width:100%;min-width:0;min-height:40px;display:flex;align-items:center;gap:7px;overflow:hidden;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;color:#465166;font-size:11px;cursor:pointer}.form-field .artist-pick input{box-sizing:border-box;width:16px;height:16px;min-height:16px;flex:0 0 16px;margin:0;padding:0;border-radius:3px;accent-color:#0878f9}.artist-pick span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.artist-pick small,.artist-empty{flex:0 0 auto;color:#9099a6;font-size:10px}.admin-content{max-width:1040px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.concert-form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.form-section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.form-section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.form-section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;transition:.15s}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.form-field input::placeholder,.form-field textarea::placeholder{color:#a3acb8}.field-error{color:#c43f43;font-size:9px}.field-hint{align-self:flex-end;color:#9aa3b1;font-size:9px}.input-icon,.price-input{position:relative;display:flex;align-items:center}.input-icon>svg{position:absolute;left:11px;color:#94a0b0;pointer-events:none}.input-icon input{padding-left:36px}.price-input input{padding-right:53px}.price-input span{position:absolute;right:11px;color:#9099a6;font-size:9px;font-weight:700}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.status-icon{background:#eef7f2;color:#238355}.status-grid{align-items:end}.active-control{position:relative;min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.active-control input:focus-visible+.toggle-track{outline:3px solid #0878f944}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error-panel a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.concert-form-card{padding:19px 16px}.admin-page-heading h1{font-size:25px}.form-grid{grid-template-columns:1fr;gap:14px}.form-field.full{grid-column:auto}.status-section{margin-top:20px}.status-grid{gap:13px}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}`]
})
export class ConcertForm implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  readonly store = inject(ConcertsStore);
  readonly artistsStore = inject(ArtistsStore);
  readonly slug = signal<string | null>(null);
  readonly isEditMode = computed(() => this.slug() !== null);
  readonly statuses = CONCERT_STATUSES;
  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', Validators.maxLength(500)],
    artistIds: [[] as string[]],
    status: ['scheduled' as ConcertStatus, Validators.required],
    isActive: [true]
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.slug.set(slug);
    this.store.clearError();
    void this.artistsStore.loadAll();
    if (slug) void this.load(slug);
  }

  fieldError(name: 'title'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  statusLabel(status: ConcertStatus): string {
    return ({ scheduled: 'Programado', full: 'Completo', cancelled: 'Cancelado', completed: 'Finalizado' })[status];
  }

  async load(slug: string): Promise<void> {
    const concert = await this.store.loadBySlug(slug);
    if (!concert) return;
    this.form.patchValue({
      title: concert.title,
      description: concert.description ?? '',
      artistIds: concert.artistIds ?? [],
      status: concert.status,
      isActive: concert.isActive
    });
  }

  hasArtist(artistId: string): boolean {
    return this.form.controls.artistIds.value.includes(artistId);
  }

  toggleArtist(artistId: string): void {
    const current = this.form.controls.artistIds.value;
    this.form.controls.artistIds.setValue(
      current.includes(artistId) ? current.filter((id) => id !== artistId) : [...current, artistId]
    );
  }

  async submit(): Promise<void> {
    this.store.clearError();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const saved = await this.store.save(value, this.store.selected()?._id);
    if (!saved) return;

    await this.alerts.success(this.isEditMode() ? 'Concierto actualizado' : 'Concierto creado', saved.title);
    await this.router.navigateByUrl('/concerts');
  }

}
