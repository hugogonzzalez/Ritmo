import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';

// Registro público: crea siempre cuentas de cliente. Mismo diseño que la pantalla de login.
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="login-screen">
      <img class="login-logo" src="/ritmo-logo.svg" alt="Ritmo Conciertos">

      <div class="login-card">
        <h1>Crear cuenta</h1>
        <p class="login-copy">Regístrate para comprar entradas y seguir tus conciertos.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-form" novalidate>
          @if (errorMessage()) { <div class="form-error" role="alert">{{ errorMessage() }}</div> }

          <div class="form-field">
            <label for="name">Nombre</label>
            <input id="name" type="text" formControlName="name" autocomplete="name" placeholder="Ana García">
            @if (invalido('name')) { <small class="field-error">Escribe tu nombre.</small> }
          </div>

          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="ana@correo.com">
            @if (invalido('email')) { <small class="field-error">Introduce un email válido.</small> }
          </div>

          <div class="form-field">
            <label for="password">Contraseña</label>
            <input id="password" type="password" formControlName="password" autocomplete="new-password">
            <small class="field-hint">Mínimo 8 caracteres, con al menos una letra y un número.</small>
            @if (invalido('password')) { <small class="field-error">La contraseña no cumple los requisitos.</small> }
          </div>

          <button type="submit" class="primary-action" [disabled]="enviando()">{{ enviando() ? 'Creando cuenta…' : 'Crear cuenta' }}</button>
        </form>
        <p class="login-copy">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </div>
    </section>
  `,
  styles: [`.login-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:24px;background:#121a27;box-sizing:border-box}.login-card{width:100%;max-width:380px;padding:32px 30px;border:1px solid #e6eaf0;border-radius:16px;background:#fff;box-shadow:0 8px 24px #00000040}.login-logo{display:block;width:200px;height:auto}h1{margin:0;color:#263143;font:700 22px 'Space Grotesk',sans-serif;text-align:center}.login-copy{margin:6px 0 24px;color:#758093;font-size:12px;text-align:center}.login-form{display:grid;gap:17px}.form-field{display:flex;flex-direction:column;gap:7px}.form-field label{color:#465166;font-size:11px;font-weight:700}.form-field input{width:100%;min-height:41px;border:1px solid #dfe4eb;border-radius:8px;padding:10px 11px;color:#273144;font:inherit;font-size:12px;outline:0;box-sizing:border-box}.form-field input:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.field-error{color:#c43f43;font-size:10px}.form-error{padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:12px}.primary-action{min-height:41px;border:0;border-radius:8px;background:#0878f9;color:white;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.primary-action:hover{background:#0669dc}.primary-action:disabled{opacity:.6;cursor:wait}.field-hint{color:#758093;font-size:10px}`]
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  readonly enviando = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]]
  });

  invalido(campo: 'name' | 'email' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorMessage.set(null);

    try {
      const datos = this.form.getRawValue();
      await this.authService.register({
        name: datos.name.trim(),
        email: datos.email.trim(),
        password: datos.password
      });
      await this.alerts.success('Cuenta creada', 'Ya puedes iniciar sesión con tu email y contraseña.');
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.errorMessage.set(this.mensajeError(error));
    } finally {
      this.enviando.set(false);
    }
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) return 'Ya existe una cuenta con ese email. Prueba a iniciar sesión.';
      if (error.status === 400) return 'Revisa los datos. La contraseña necesita al menos 8 caracteres, una letra y un número.';
    }
    return 'No se ha podido crear la cuenta. Inténtalo de nuevo.';
  }
}
