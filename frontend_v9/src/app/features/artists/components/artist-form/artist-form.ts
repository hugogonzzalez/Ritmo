import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideMusic, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { AlertService } from '../../../../core/services/alert.service';
import { ArtistsStore } from '../../../../core/stores/artists.store';
import { Artist, ArtistPayload, ArtistSocial, SOCIAL_PLATFORMS, SocialPlatform } from '../../../../core/models/artist.model';

type SocialGroup = FormGroup<{ platform: FormControl<SocialPlatform>; url: FormControl<string> }>;

function socialGroup(fb: NonNullableFormBuilder, social?: ArtistSocial): SocialGroup {
  return fb.group({
    platform: [social?.platform ?? 'web' as SocialPlatform],
    url: [social?.url ?? '', [Validators.required]]
  });
}

@Component({
  selector: 'app-artist-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SkeletonLoader, ErrorState, ImageManager, LucideArrowLeft, LucideMusic, LucidePlus, LucideTrash2],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/artists"><svg lucideArrowLeft [size]="16"></svg> Volver a artistas</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE ARTISTAS</p><h1>{{ isEditMode() ? 'Editar artista' : 'Nuevo artista' }}</h1><p class="heading-copy">{{ isEditMode() ? 'Actualiza el nombre, la biografía y las redes.' : 'Completa los datos para añadirlo al catálogo.' }}</p></div>
      </div>

      @if (loading()) {
        <div class="form-card"><app-skeleton-loader [count]="5" /></div>
      } @else if (isEditMode() && !artist()) {
        <app-error-state [message]="error() ?? 'No se ha podido cargar el artista.'" />
      } @else {
        <form class="form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="section-title"><span class="form-icon"><svg lucideMusic [size]="18"></svg></span><div><h2>Información del artista</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
          @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }
          <div class="form-grid">
            <div class="form-field full"><label for="name">Nombre artístico <b>*</b></label><input id="name" formControlName="name" maxlength="120" placeholder="Ej. Ana García">@if (fieldError('name')) { <small class="field-error">Escribe un nombre de entre 1 y 120 caracteres.</small> }</div>
            <div class="form-field full"><label for="bio">Biografía</label><textarea id="bio" rows="4" maxlength="1000" formControlName="bio" placeholder="Información sobre el artista (opcional)"></textarea><small class="field-hint">{{ form.controls.bio.value.length }}/1000 caracteres</small></div>
          </div>

          <div class="section-title status-section"><span class="form-icon status-icon"><svg lucidePlus [size]="18"></svg></span><div><h2>Redes sociales</h2><p>Añade tantas como necesites.</p></div></div>
          <div class="socials" formArrayName="socials">
            @for (social of form.controls.socials.controls; track $index; let i = $index) {
              <div class="social-row" [formGroup]="social">
                <select formControlName="platform" aria-label="Red social">@for (platform of platforms; track platform) { <option [value]="platform">{{ platform }}</option> }</select>
                <input formControlName="url" placeholder="https://..." aria-label="URL de la red">
                <button type="button" class="icon-action delete-action" (click)="removeSocial(i)" aria-label="Quitar red"><svg lucideTrash2 [size]="14"></svg></button>
              </div>
            }
          </div>
          <div class="social-add"><button type="button" class="secondary-action" (click)="addSocial()"><svg lucidePlus [size]="14"></svg> Añadir red</button></div>

          <div class="section-title status-section"><span class="form-icon status-icon"><svg lucideMusic [size]="18"></svg></span><div><h2>Estado</h2><p>Controla si el artista está visible.</p></div></div>
          <label class="active-control" for="isActive"><span class="switch-copy"><strong>Artista activo</strong><small>{{ form.controls.isActive.value ? 'Visible en la web pública' : 'Oculto en la web pública' }}</small></span><input id="isActive" type="checkbox" formControlName="isActive"><span class="toggle-track"><i></i></span></label>

          <div class="form-actions"><a routerLink="/artists" class="secondary-action">Cancelar</a><button type="submit" class="primary-action" [disabled]="saving()"><svg lucideMusic [size]="16"></svg>{{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear artista') }}</button></div>
        </form>

        @if (artist(); as current) {
          <app-image-manager ownerType="artist" [ownerId]="current._id" />
        }
      }
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.section-title{display:flex;align-items:center;gap:11px;margin-bottom:21px}.form-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.section-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.section-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px 18px}.form-field{min-width:0;display:flex;flex-direction:column;gap:7px}.form-field.full{grid-column:1/-1}.form-field label{color:#465166;font-size:10px;font-weight:700}.form-field label b{color:#e25559}.form-field input,.form-field select,.form-field textarea,.social-row select,.social-row input{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:10px 11px;color:#273144;font:inherit;font-size:11px;outline:0}.form-field textarea{resize:vertical;min-height:89px;line-height:1.5}.field-error{color:#c43f43;font-size:9px}.field-hint{align-self:flex-end;color:#9aa3b1;font-size:9px}.status-section{margin:25px 0 18px;padding-top:22px;border-top:1px solid #edf0f4}.status-icon{background:#eef7f2;color:#238355}.socials{display:grid;gap:10px}.social-row{display:grid;grid-template-columns:150px 1fr 34px;gap:10px;align-items:center}.social-add{margin-top:12px}.icon-action{width:34px;height:34px;display:grid;place-items:center;border:1px solid #ffc4c4;border-radius:7px;background:#fff;color:#ce3339;cursor:pointer}.secondary-action,.primary-action{min-height:39px;display:inline-flex;justify-content:center;align-items:center;gap:8px;border-radius:8px;padding:0 15px;text-decoration:none;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{border:0;background:#0878f9;color:white}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.secondary-action{border:1px solid #dfe4eb;background:#fff;color:#606b7c}.active-control{min-height:41px;display:flex;align-items:center;justify-content:space-between;gap:15px;border:1px solid #dfe4eb;border-radius:8px;padding:8px 11px;cursor:pointer}.switch-copy{display:grid;gap:3px}.switch-copy strong{color:#465166;font-size:10px}.switch-copy small{color:#9099a6;font-size:9px}.active-control input{position:absolute;opacity:0;width:1px;height:1px}.toggle-track{width:35px;height:20px;display:flex;align-items:center;padding:2px;border-radius:99px;background:#bcc4cf;transition:.18s}.toggle-track i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:.18s}.active-control input:checked+.toggle-track{background:#22a765}.active-control input:checked+.toggle-track i{transform:translateX(15px)}.form-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:25px;padding-top:19px;border-top:1px solid #edf0f4}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr}.form-field.full{grid-column:auto}.social-row{grid-template-columns:1fr 34px}}`]
})
export class ArtistForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  private readonly store = inject(ArtistsStore);

  readonly artistId = signal<string | null>(null);
  readonly artist = this.store.selected;
  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly isEditMode = computed(() => this.artistId() !== null);
  readonly platforms = SOCIAL_PLATFORMS;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    bio: ['', [Validators.maxLength(1000)]],
    isActive: [true],
    socials: this.fb.array<SocialGroup>([])
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.artistId.set(id);
    if (!id) return;

    const artist = await this.store.loadById(id);
    if (artist) this.patch(artist);
  }

  fieldError(name: 'name' | 'bio'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  addSocial(): void {
    this.form.controls.socials.push(socialGroup(this.fb));
  }

  removeSocial(index: number): void {
    this.form.controls.socials.removeAt(index);
  }

  async submit(): Promise<void> {
    this.store.clearError();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ArtistPayload = {
      name: raw.name.trim(),
      bio: raw.bio.trim(),
      isActive: raw.isActive,
      socials: raw.socials.map((social) => ({ platform: social.platform, url: social.url.trim() }))
    };

    const saved = await this.store.save(payload, this.artistId() ?? undefined);
    if (!saved) return;

    await this.alerts.success(this.isEditMode() ? 'Artista actualizado' : 'Artista creado', saved.name);
    await this.router.navigateByUrl('/artists');
  }

  private patch(artist: Artist): void {
    this.form.patchValue({ name: artist.name, bio: artist.bio ?? '', isActive: artist.isActive });
    this.form.controls.socials.clear();
    for (const social of artist.socials ?? []) {
      this.form.controls.socials.push(socialGroup(this.fb, social));
    }
  }
}
