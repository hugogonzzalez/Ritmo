import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="login-screen">
      <img class="login-logo" src="/ritmo-logo.svg" alt="Ritmo Conciertos">

      <div class="login-card">
        <h1>Iniciar sesión</h1>
        <p class="login-copy">Accede con tu email y tu contraseña.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-form" novalidate>
          @if (errorMessage()) { <div class="form-error" role="alert">{{ errorMessage() }}</div> }

          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="ana.garcia@ritmo.test">
            @if (emailInvalid()) { <small class="field-error">Introduce un email válido.</small> }
          </div>

          <div class="form-field">
            <label for="password">Contraseña</label>
            <input id="password" type="password" formControlName="password" autocomplete="current-password">
            @if (passwordInvalid()) { <small class="field-error">Escribe tu contraseña.</small> }
          </div>

          <button type="submit" class="primary-action" [disabled]="submitting()">{{ submitting() ? 'Entrando…' : 'Entrar' }}</button>
        </form>
      </div>
    </section>
  `,
  styles: [`.login-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:24px;background:#121a27;box-sizing:border-box}.login-card{width:100%;max-width:380px;padding:32px 30px;border:1px solid #e6eaf0;border-radius:16px;background:#fff;box-shadow:0 8px 24px #00000040}.login-logo{display:block;width:200px;height:auto}h1{margin:0;color:#263143;font:700 22px 'Space Grotesk',sans-serif;text-align:center}.login-copy{margin:6px 0 24px;color:#758093;font-size:12px;text-align:center}.login-form{display:grid;gap:17px}.form-field{display:flex;flex-direction:column;gap:7px}.form-field label{color:#465166;font-size:11px;font-weight:700}.form-field input{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;padding:10px 11px;color:#273144;font:inherit;font-size:12px;outline:0;box-sizing:border-box}.form-field input:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:10px}.form-error{padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:12px}.primary-action{min-height:41px;border:0;border-radius:8px;background:#0878f9;color:white;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}`]
})
export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.touched && control.invalid;
  }

  passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.touched && control.invalid;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      const raw = this.form.getRawValue();
      await this.authService.login({ email: raw.email.trim(), password: raw.password });
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (error) {
      this.errorMessage.set(this.loginErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private loginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Email o contraseña incorrectos, o la cuenta está bloqueada.';
    }
    return 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
  }

  // Solo se acepta una ruta interna; evita redirecciones a otros dominios o al propio login
  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const isInternal = !!returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/login');
    return isInternal && returnUrl ? returnUrl : '/concerts';
  }
}
