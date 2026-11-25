import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../../../core/services/alert.service';
import { CommentService } from '../../../../core/services/comment.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ShopVariant } from '../../../../core/models/shop.model';
import { VariantComment, VariantComments } from '../../../../core/models/comment.model';

const CAMPO = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1684ff]';

// Valoraciones de la variante seleccionada: lista, media, formulario (con sesión) y borrado
@Component({
  selector: 'app-variant-comments',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  template: `
    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Valoraciones</h2>
          <p class="mt-1 text-sm text-gray-500">Entrada: <span class="font-medium text-gray-700">{{ variant().name }}</span></p>
        </div>
        @if (data(); as datos) {
          @if (datos.valoracion.total > 0) {
            <div class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm">
              <span class="font-bold text-amber-600">★ {{ datos.valoracion.media }}</span>
              <span class="text-gray-500">{{ datos.valoracion.total }} {{ datos.valoracion.total === 1 ? 'valoración' : 'valoraciones' }}</span>
            </div>
          }
        }
      </div>

      @if (loading()) {
        <div class="mt-6 h-24 animate-pulse rounded-xl bg-gray-100"></div>
      } @else if (error()) {
        <p class="mt-6 text-sm text-red-600">{{ error() }}</p>
      } @else {

        @if (!authStore.isAuthenticated()) {
          <div class="mt-6 rounded-xl bg-blue-50 px-5 py-4 text-sm text-blue-900">
            Para dejar tu valoración, <a routerLink="/login" class="font-semibold underline">inicia sesión</a>.
          </div>
        } @else if (miComentario() && !editandoId()) {
          <div class="mt-6 rounded-xl bg-gray-50 px-5 py-4 text-sm text-gray-600">
            Ya has valorado esta entrada. Puedes editar tu valoración desde tu comentario.
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p class="text-sm font-semibold text-gray-900">{{ editandoId() ? 'Edita tu valoración' : 'Deja tu valoración' }}</p>

            <div class="mt-3 flex gap-1" role="group" aria-label="Valoración de 1 a 5 estrellas">
              @for (estrella of estrellas; track estrella) {
                <button type="button" (click)="form.controls.rating.setValue(estrella)" [attr.aria-label]="estrella + ' estrellas'"
                        class="border-0 bg-transparent p-0 text-3xl leading-none transition hover:scale-110 cursor-pointer"
                        [class]="estrella <= form.controls.rating.value ? 'text-amber-400' : 'text-gray-300'">★</button>
              }
            </div>

            <textarea formControlName="text" rows="3" maxlength="500" placeholder="Cuéntanos qué tal estuvo…"
                      class="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1684ff]"></textarea>
            @if (form.controls.text.touched && form.controls.text.invalid) {
              <small class="mt-1 block text-xs text-red-600">Escribe un comentario de 1 a 500 caracteres.</small>
            }

            <div class="mt-4 flex justify-end gap-2">
              @if (editandoId()) {
                <button type="button" (click)="cancelarEdicion()"
                        class="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
              }
              <button type="submit" [disabled]="enviando()"
                      class="rounded-xl border-0 bg-[#1684ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1769bd] disabled:cursor-wait disabled:opacity-60">
                {{ enviando() ? 'Guardando…' : (editandoId() ? 'Guardar cambios' : 'Publicar') }}
              </button>
            </div>
          </form>
        }

        @if (data(); as datos) {
          @if (datos.comentarios.length > 0) {
            <ul class="mt-6 divide-y divide-gray-100">
              @for (comentario of datos.comentarios; track comentario._id) {
                <li class="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-sm font-bold text-blue-700">
                    @if (comentario.author?.avatarUrl) {
                      <img [src]="comentario.author?.avatarUrl" [alt]="comentario.author?.name" class="h-full w-full object-cover" />
                    } @else {
                      {{ inicial(comentario) }}
                    }
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p class="text-sm font-semibold text-gray-900">{{ comentario.author?.name ?? 'Usuario eliminado' }}</p>
                      <span class="text-xs tracking-wide text-amber-400" [attr.aria-label]="comentario.rating + ' de 5 estrellas'">{{ estrellasTexto(comentario.rating) }}</span>
                      <span class="text-xs text-gray-400">{{ comentario.createdAt | date: 'dd/MM/yyyy' }}</span>
                    </div>
                    <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-700">{{ comentario.text }}</p>

                    @if (esMio(comentario) || puedeBorrar(comentario)) {
                      <div class="mt-2 flex gap-4 text-xs font-semibold">
                        @if (esMio(comentario)) {
                          <button type="button" (click)="editar(comentario)" class="border-0 bg-transparent p-0 text-[#1684ff] hover:underline">Editar</button>
                        }
                        @if (puedeBorrar(comentario)) {
                          <button type="button" (click)="borrar(comentario)" class="border-0 bg-transparent p-0 text-red-600 hover:underline">Borrar</button>
                        }
                      </div>
                    }
                  </div>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-6 text-sm text-gray-500">Todavía no hay valoraciones para esta entrada. ¡Sé el primero!</p>
          }
        }
      }
    </section>
  `,
  host: { class: 'block' }
})
export class VariantCommentsSection {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly commentService = inject(CommentService);
  private readonly alerts = inject(AlertService);
  protected readonly authStore = inject(AuthStore);

  // La variante seleccionada en la página de detalle
  readonly variant = input.required<ShopVariant>();

  protected readonly estrellas = [1, 2, 3, 4, 5];
  protected readonly campo = CAMPO;
  protected readonly data = signal<VariantComments | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly editandoId = signal<string | null>(null);

  protected readonly form = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    text: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]]
  });

  private requestId = 0;

  constructor() {
    // Cada vez que cambia la variante, se cargan sus valoraciones
    effect(() => {
      const variantId = this.variant()._id;
      untracked(() => {
        this.cancelarEdicion();
        this.data.set(null);
        void this.cargar(variantId);
      });
    });
  }

  protected miComentario(): VariantComment | null {
    const usuarioId = this.authStore.user()?._id;
    if (!usuarioId) return null;
    return this.data()?.comentarios.find(c => c.author?._id === usuarioId) ?? null;
  }

  protected esMio(comentario: VariantComment): boolean {
    return !!comentario.author && comentario.author._id === this.authStore.user()?._id;
  }

  protected puedeBorrar(comentario: VariantComment): boolean {
    return this.esMio(comentario) || this.authStore.isAdmin();
  }

  protected inicial(comentario: VariantComment): string {
    return (comentario.author?.name ?? '?').charAt(0).toUpperCase();
  }

  protected estrellasTexto(valor: number): string {
    return '★'.repeat(valor) + '☆'.repeat(5 - valor);
  }

  protected editar(comentario: VariantComment): void {
    this.editandoId.set(comentario._id);
    this.form.setValue({ rating: comentario.rating, text: comentario.text });
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset({ rating: 5, text: '' });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();
    const editando = this.editandoId();
    const variantId = this.variant()._id;

    this.enviando.set(true);
    try {
      if (editando) {
        await this.commentService.update(editando, datos);
      } else {
        await this.commentService.create(variantId, datos);
      }
      this.cancelarEdicion();
      await this.cargar(variantId);
    } catch {
      // El interceptor de errores ya muestra el motivo (por ejemplo, si ya habías valorado la entrada)
    } finally {
      this.enviando.set(false);
    }
  }

  protected async borrar(comentario: VariantComment): Promise<void> {
    const confirmacion = await this.alerts.confirm('¿Borrar la valoración?', 'Esta acción no se puede deshacer.', 'Borrar');
    if (!confirmacion.isConfirmed) return;

    const variantId = this.variant()._id;
    try {
      await this.commentService.remove(comentario._id);
      await this.cargar(variantId);
    } catch {
      // Lo muestra el interceptor de errores
    }
  }

  private async cargar(variantId: string): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);

    try {
      const respuesta = await this.commentService.listByVariant(variantId);
      if (id !== this.requestId) return;
      this.data.set(respuesta.data);
    } catch (error) {
      if (id !== this.requestId) return;
      this.error.set(getApiErrorMessage(error, 'No se han podido cargar las valoraciones.'));
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }
}
