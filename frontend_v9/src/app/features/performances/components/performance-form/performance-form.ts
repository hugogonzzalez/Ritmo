import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { LucideArrowLeft, LucideCalendarDays, LucideTicket } from '@lucide/angular';
import { AlertService } from '../../../../core/services/alert.service';
import { ConcertService } from '../../../../core/services/concert.service';
import { ArtistsStore } from '../../../../core/stores/artists.store';
import { PerformanceService } from '../../../../core/services/performance.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { Concert } from '../../../../core/models/concert.model';
import {
  PERFORMANCE_STATUSES,
  Performance,
  PerformancePayload,
  PerformanceStatus
} from '../../../../core/models/performance.model';

@Component({
  selector: 'app-performance-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SkeletonLoader, ImageManager, LucideArrowLeft, LucideCalendarDays, LucideTicket],
  template: `
    <section class="admin-content form-page">
      <a class="form-back" routerLink="/performances"><svg lucideArrowLeft [size]="16"></svg> Volver a sesiones</a>
      <div class="admin-page-heading form-heading">
        <div><p class="eyebrow">GESTIÓN DE SESIONES</p><h1>{{ isEditMode() ? 'Editar sesión' : 'Nueva sesión' }}</h1><p class="heading-copy">{{ isEditMode() ? 'Actualiza la fecha, la sala, el aforo y el precio.' : 'Añade una fecha, una sala y un precio a un concierto.' }}</p></div>
      </div>
      @if (loading()) {
        <app-skeleton-loader [count]="5" />
      } @else if (isEditMode() && !performance()) {
        <div class="form-error-panel" role="alert">{{ error() || 'No se ha podido cargar la sesión.' }}<a routerLink="/performances">Volver al listado</a></div>
      } @else {
        <form class="concert-form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-section-title"><span class="form-icon"><svg lucideCalendarDays [size]="18"></svg></span><div><h2>Información de la sesión</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
          @if (error()) { <div class="form-error-panel" role="alert">{{ error() }}</div> }
          <div class="form-grid">
            <div class="form-field full"><label for="concertId">Concierto <b>*</b></label><select id="concertId" formControlName="concertId"><option value="">Selecciona un concierto</option>@for (concert of concerts(); track concert._id) { <option [value]="concert._id">{{ concert.title }}</option> }</select>@if (fieldError('concertId')) { <small class="field-error">Selecciona el concierto al que pertenece la sesión.</small> }</div>
            <div class="form-field full"><label>Artistas del cartel</label><div class="artist-picks">@for (artist of artistsStore.artists(); track artist._id) { <label class="artist-pick"><input type="checkbox" [checked]="hasArtist(artist._id)" (change)="toggleArtist(artist._id)"><span>{{ artist.name }}</span>@if (!artist.isActive) { <small>(inactivo)</small> }</label> } @empty { <small class="artist-empty">{{ artistsStore.error() ?? 'Aún no hay artistas. Créalos en la sección Artistas.' }}</small> }</div></div>
            <div class="form-field"><label for="venue">Sala <b>*</b></label><input id="venue" formControlName="venue" maxlength="120" placeholder="Ej. WiZink Center">@if (fieldError('venue')) { <small class="field-error">Indica una sala de entre 1 y 120 caracteres.</small> }</div>
            <div class="form-field"><label for="city">Ciudad <b>*</b></label><input id="city" formControlName="city" maxlength="80" placeholder="Ej. Madrid">@if (fieldError('city')) { <small class="field-error">Indica una ciudad de entre 1 y 80 caracteres.</small> }</div>
            <div class="form-field"><label for="startsAt">Inicio <b>*</b></label><input id="startsAt" type="datetime-local" formControlName="startsAt">@if (fieldError('startsAt')) { <small class="field-error">La fecha de inicio es obligatoria.</small> }</div>
            <div class="form-field"><label for="endsAt">Fin (opcional)</label><input id="endsAt" type="datetime-local" formControlName="endsAt"></div>
            <div class="form-field"><label for="capacity">Aforo <b>*</b></label><input id="capacity" type="number" min="1" formControlName="capacity">@if (fieldError('capacity')) { <small class="field-error">El aforo debe ser mayor que 0.</small> }</div>
            <div class="form-field"><label for="price">Precio (€) <b>*</b></label><input id="price" type="number" min="0" step="0.01" formControlName="price">@if (fieldError('price')) { <small class="field-error">El precio debe ser 0 o más.</small> }</div>
            <div class="form-field"><label for="bookedParticipants">Entradas vendidas</label><input id="bookedParticipants" type="number" min="0" formControlName="bookedParticipants"></div>
          </div>
          <div class="form-section-title status-section"><span class="form-icon status-icon"><svg lucideTicket [size]="18"></svg></span><div><h2>Publicación y estado</h2><p>Controla si la sesión está visible y en qué situación se encuentra.</p></div></div>
          <div class="form-grid status-grid">
            <div class="form-field"><label for="status">Status de la sesión</label><select id="status" formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusLabel(status) }}</option> }</select></div>
            <label class="active-control" for="isActive"><span class="switch-copy"><strong>Sesión activa</strong><small>{{ form.controls.isActive.value ? 'Visible en la web pública' : 'Oculta en la web pública' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>
          </div>
          <div class="form-actions"><a routerLink="/performances" class="secondary-action">Cancelar</a><button type="submit" class="primary-action" [disabled]="saving()"><svg lucideCalendarDays [size]="16"></svg>{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear sesión') }}</button></div>
        </form>
        @if (performance(); as current) {
          <app-image-manager ownerType="performance" [ownerId]="current._id" />
        }
      }
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.concert-form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.form-section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.form-section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.form-section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0;transition:.15s}.form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.form-field input::placeholder{color:#a3acb8}.field-error{color:#c43f43;font-size:9px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.status-icon{background:#eef7f2;color:#238355}.status-grid{align-items:end}.active-control{position:relative;min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.active-control input:focus-visible+.toggle-track{outline:3px solid #0878f944}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.primary-action,.secondary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.secondary-action:hover{background:#f6f8fa}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error-panel a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}.artist-picks{display:flex;flex-wrap:wrap;gap:8px}.artist-pick{display:inline-flex;align-items:center;gap:7px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;color:#465166;font-size:11px;cursor:pointer}.artist-pick input{accent-color:#0878f9}.artist-pick small,.artist-empty{color:#9099a6;font-size:10px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.concert-form-card{padding:19px 16px}.admin-page-heading h1{font-size:25px}.form-grid{grid-template-columns:1fr;gap:14px}.form-field.full{grid-column:auto}.status-section{margin-top:20px}.status-grid{gap:13px}.form-actions{justify-content:stretch}.form-actions>*{flex:1}}`]
})
export class PerformanceForm implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  private readonly performanceService = inject(PerformanceService);
  private readonly concertService = inject(ConcertService);
  readonly artistsStore = inject(ArtistsStore);

  readonly performanceId = signal<string | null>(null);
  readonly performance = signal<Performance | null>(null);
  readonly concerts = signal<Concert[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEditMode = computed(() => this.performanceId() !== null);
  readonly statuses = PERFORMANCE_STATUSES;

  readonly form = this.fb.group({
    concertId: ['', [Validators.required]],
    artistIds: [[] as string[]],
    venue: ['', [Validators.required, Validators.maxLength(120)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    startsAt: ['', [Validators.required]],
    endsAt: [''],
    capacity: [1000, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    bookedParticipants: [0, [Validators.required, Validators.min(0)]],
    status: ['scheduled' as PerformanceStatus, [Validators.required]],
    isActive: [true]
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.performanceId.set(id);
    this.error.set(null);
    this.loading.set(true);

    try {
      const [concerts, performance] = await Promise.all([
        this.concertService.listAdmin(),
        id ? this.performanceService.getById(id) : Promise.resolve(null),
        this.artistsStore.loadAll()
      ]);
      this.concerts.set(concerts);
      if (performance) {
        this.performance.set(performance);
        this.patch(performance);
      }
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido cargar los datos de la sesión.'));
    } finally {
      this.loading.set(false);
    }
  }

  fieldError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.touched && control.invalid;
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

  statusLabel(status: PerformanceStatus): string {
    return ({ scheduled: 'Programado', full: 'Completo', cancelled: 'Cancelado', completed: 'Finalizado' })[status];
  }

  async submit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const startsAt = new Date(raw.startsAt);
    const endsAt = raw.endsAt ? new Date(raw.endsAt) : null;

    if (Number.isNaN(startsAt.getTime())) {
      this.error.set('La fecha de inicio no es válida.');
      return;
    }
    if (endsAt && (Number.isNaN(endsAt.getTime()) || startsAt >= endsAt)) {
      this.error.set('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }
    if (raw.bookedParticipants > raw.capacity) {
      this.error.set('Las entradas vendidas no pueden superar el aforo.');
      return;
    }

    const payload: PerformancePayload = {
      concertId: raw.concertId,
      venue: raw.venue.trim(),
      city: raw.city.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt ? endsAt.toISOString() : null,
      capacity: Number(raw.capacity),
      price: Number(raw.price),
      bookedParticipants: Number(raw.bookedParticipants),
      status: raw.status,
      isActive: raw.isActive,
      artistIds: raw.artistIds
    };

    const id = this.performanceId();
    this.saving.set(true);
    try {
      const saved = id
        ? await this.performanceService.update(id, payload)
        : await this.performanceService.create(payload);
      await this.alerts.success(id ? 'Sesión actualizada' : 'Sesión creada', saved.venue);
      await this.router.navigateByUrl('/performances');
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se ha podido guardar la sesión.'));
    } finally {
      this.saving.set(false);
    }
  }

  private patch(performance: Performance): void {
    this.form.patchValue({
      concertId: performance.concertId,
      venue: performance.venue,
      city: performance.city,
      startsAt: this.toDatetimeLocal(performance.startsAt),
      endsAt: performance.endsAt ? this.toDatetimeLocal(performance.endsAt) : '',
      capacity: performance.capacity,
      price: performance.price,
      bookedParticipants: performance.bookedParticipants,
      status: performance.status,
      isActive: performance.isActive,
      artistIds: performance.artistIds ?? []
    });
  }

  private toDatetimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
