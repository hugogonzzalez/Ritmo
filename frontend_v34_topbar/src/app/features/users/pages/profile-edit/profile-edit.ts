import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { ProfileForm } from '../../../profile/components/profile-form/profile-form';
import { Profile, ProfilePayload } from '../../../../core/models/profile.model';
import { AlertService } from '../../../../core/services/alert.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ProfileService } from '../../../../core/services/profile.service';
import { UserService } from '../../../../core/services/user.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';

// Edición del perfil de otro usuario (solo administradores). Reutiliza el formulario del perfil propio.
@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ProfileForm, RouterLink, LucideArrowLeft, ErrorState, SkeletonLoader],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/users/profiles"><svg lucideArrowLeft [size]="16"></svg> Volver a perfiles</a>

      <div class="admin-page-heading">
        <div><p class="eyebrow">ADMINISTRACIÓN</p><h1>Editar perfil</h1><p class="heading-copy">Perfil de {{ userName() }}</p></div>
      </div>

      @if (error()) { <app-error-state [message]="error() ?? ''" (retry)="load()" /> }

      @if (loading()) {
        <app-skeleton-loader [count]="4" />
      } @else if (profile()) {
        <div class="panel">
          <app-profile-form [value]="profile()" [saving]="saving()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
        </div>
      }
    </section>
  `,
  styles: [`.admin-content{max-width:900px;margin:auto;padding:31px 36px 48px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:17px;color:#647084;font-size:11px;font-weight:700;text-decoration:none}.form-back:hover{color:#0878f9}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.admin-page-heading{margin-bottom:21px}.panel{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}@media(max-width:850px){.admin-content{padding:25px 18px 40px}}`]
})
export class ProfileEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly userService = inject(UserService);
  private readonly alerts = inject(AlertService);

  private readonly userId = this.route.snapshot.paramMap.get('userId') ?? '';

  readonly profile = signal<Profile | null>(null);
  readonly userName = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [profileResponse, userResponse] = await Promise.all([
        this.profileService.getByUserId(this.userId),
        this.userService.getById(this.userId)
      ]);
      this.profile.set(profileResponse.data);
      this.userName.set(userResponse.data.name);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se ha podido cargar el perfil.'));
    } finally {
      this.loading.set(false);
    }
  }

  async save(payload: ProfilePayload): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.profileService.updateByUserId(this.userId, payload);
      await this.alerts.success('Perfil actualizado', 'Los datos del perfil se han guardado correctamente.');
      await this.router.navigateByUrl('/users/profiles');
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido guardar los cambios.'));
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/users/profiles');
  }
}
