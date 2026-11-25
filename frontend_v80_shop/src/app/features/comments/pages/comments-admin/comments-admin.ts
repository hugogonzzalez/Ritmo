import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminComment, SentimientoConcierto } from '../../../../core/models/comment.model';
import { ShopConcert, ShopPagination } from '../../../../core/models/shop.model';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { AlertService } from '../../../../core/services/alert.service';
import { AdminCommentFilters, CommentService } from '../../../../core/services/comment.service';
import { ShopService } from '../../../../core/services/shop.service';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { environment } from '../../../../../environments/environment';

const FILTROS_INICIALES: AdminCommentFilters = { q: '', concertId: '', rating: null, sort: 'desc' };

// Estado del resumen de la IA para un concierto
interface ResumenIA {
  estado: 'cargando' | 'listo' | 'error';
  texto?: string;
}

// Dashboard del admin: todas las valoraciones de los clientes, con borrado de cualquiera
@Component({
  selector: 'app-comments-admin',
  standalone: true,
  imports: [DatePipe, Pagination],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-8">
      <div class="mb-6">
        <p class="text-xs font-bold uppercase tracking-widest text-[#0878f9]">Comunidad</p>
        <h1 class="mt-1 text-2xl font-bold text-gray-900">Valoraciones</h1>
        <p class="mt-1 text-sm text-gray-500">Todas las valoraciones de los clientes. Como admin puedes borrar cualquiera.</p>
      </div>

      <section class="mb-8">
        <h2 class="mb-3 text-lg font-bold text-gray-900">Sentimiento por concierto</h2>
        @if (sentimiento().length === 0) {
          <p class="text-sm text-gray-500">Todavía no hay valoraciones para analizar.</p>
        } @else {
          <div class="grid gap-4 md:grid-cols-2">
            @for (concierto of sentimiento(); track concierto.concertId) {
              <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 class="font-semibold text-gray-900">{{ concierto.titulo }}</h3>
                <p class="text-xs text-gray-500">{{ concierto.total }} valoraciones · media {{ concierto.media }} de 5</p>

                <div class="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
                  <div class="bg-emerald-500" [style.width.%]="porcentaje(concierto.positivos, concierto.total)"></div>
                  <div class="bg-gray-400" [style.width.%]="porcentaje(concierto.neutros, concierto.total)"></div>
                  <div class="bg-red-500" [style.width.%]="porcentaje(concierto.negativos, concierto.total)"></div>
                </div>
                <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
                  <span>Positivas: <strong class="font-semibold text-emerald-600">{{ concierto.positivos }}</strong></span>
                  <span>Neutras: <strong class="font-semibold text-gray-700">{{ concierto.neutros }}</strong></span>
                  <span>Negativas: <strong class="font-semibold text-red-600">{{ concierto.negativos }}</strong></span>
                </div>

                <div class="mt-4 border-t border-gray-100 pt-4">
                  @if (resumenDe(concierto.concertId); as resumen) {
                    @if (resumen.estado === 'cargando') {
                      <p class="text-sm text-gray-500">Generando resumen…</p>
                    } @else if (resumen.estado === 'listo') {
                      <p class="text-sm leading-relaxed text-gray-700">{{ resumen.texto }}</p>
                    } @else {
                      <p class="text-sm text-red-600">No se ha podido generar el resumen. Revisa que el agente de IA esté en marcha.</p>
                    }
                  }
                  <button type="button" (click)="pedirResumen(concierto.concertId)" [disabled]="resumenDe(concierto.concertId)?.estado === 'cargando'"
                          class="mt-2 border-0 bg-transparent p-0 text-xs font-semibold text-[#0878f9] hover:underline disabled:opacity-50">
                    Generar resumen con IA
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </section>

      <form class="mb-5 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] md:items-end"
            (submit)="$event.preventDefault()">
        <label class="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Buscar
          <input #buscador type="search" [value]="filtros().q" (search)="cambiarFiltro({ q: buscador.value.trim() })"
                 placeholder="Texto o nombre del autor"
                 class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-[#0878f9] focus:outline-none" />
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Concierto
          <select (change)="cambiarFiltro({ concertId: $any($event.target).value })"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-[#0878f9] focus:outline-none">
            <option value="" [selected]="filtros().concertId === ''">Todos los conciertos</option>
            @for (concierto of conciertos(); track concierto._id) {
              <option [value]="concierto._id" [selected]="filtros().concertId === concierto._id">{{ concierto.title }}</option>
            }
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Estrellas
          <select (change)="cambiarEstrellas($any($event.target).value)"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-[#0878f9] focus:outline-none">
            <option value="" [selected]="filtros().rating === null">Todas</option>
            @for (estrella of [5, 4, 3, 2, 1]; track estrella) {
              <option [value]="estrella" [selected]="filtros().rating === estrella">{{ estrella }} {{ estrella === 1 ? 'estrella' : 'estrellas' }}</option>
            }
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Ordenar
          <select (change)="cambiarFiltro({ sort: $any($event.target).value === 'asc' ? 'asc' : 'desc' })"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-[#0878f9] focus:outline-none">
            <option value="desc" [selected]="filtros().sort === 'desc'">Más recientes</option>
            <option value="asc" [selected]="filtros().sort === 'asc'">Más antiguos</option>
          </select>
        </label>

        <button type="button" (click)="limpiar(buscador)"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Limpiar
        </button>
      </form>

      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        @if (error()) {
          <p class="p-5 text-sm text-red-600">{{ error() }}</p>
        }

        @if (loading()) {
          <div class="space-y-3 p-5">
            @for (fila of [1, 2, 3, 4]; track fila) {
              <div class="h-12 animate-pulse rounded-lg bg-gray-100"></div>
            }
          </div>
        } @else if (items().length === 0) {
          <p class="p-8 text-center text-sm text-gray-500">Todavía no hay valoraciones.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-4 py-3">Concierto</th>
                  <th class="px-4 py-3">Entrada</th>
                  <th class="px-4 py-3">Autor</th>
                  <th class="px-4 py-3">Estrellas</th>
                  <th class="px-4 py-3">Comentario</th>
                  <th class="px-4 py-3">Fecha</th>
                  <th class="px-4 py-3"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (comentario of items(); track comentario._id) {
                  <tr class="align-top hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ comentario.concierto ?? '—' }}</td>
                    <td class="px-4 py-3 text-gray-600">
                      {{ comentario.entrada ?? '—' }}
                      <span class="block text-xs text-gray-400">{{ comentario.ciudad ?? '' }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-700">{{ comentario.autor ?? 'Usuario eliminado' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-amber-400">{{ estrellas(comentario.rating) }}</td>
                    <td class="max-w-xs px-4 py-3 text-gray-700"><p class="line-clamp-2">{{ comentario.text }}</p></td>
                    <td class="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{{ comentario.createdAt | date: 'dd/MM/yyyy' }}</td>
                    <td class="px-4 py-3 text-right">
                      <button type="button" (click)="borrar(comentario)" [disabled]="borrando()"
                              class="border-0 bg-transparent p-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">Borrar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      @if (pagination(); as paginacion) {
        @if (paginacion.totalPages > 1) {
          <div class="mt-6">
            <app-pagination itemsLabel="valoraciones" [pagination]="paginacion" (pageChange)="irA($event)" />
          </div>
        }
      }
    </section>
  `
})
export class CommentsAdmin implements OnInit {
  private readonly commentService = inject(CommentService);
  private readonly alerts = inject(AlertService);
  private readonly shop = inject(ShopService);

  readonly conciertos = signal<ShopConcert[]>([]);
  readonly sentimiento = signal<SentimientoConcierto[]>([]);
  readonly resumenes = signal<Record<string, ResumenIA>>({});
  readonly filtros = signal<AdminCommentFilters>({ ...FILTROS_INICIALES });
  readonly items = signal<AdminComment[]>([]);
  readonly pagination = signal<ShopPagination | null>(null);
  readonly loading = signal(true);
  readonly borrando = signal(false);
  readonly error = signal<string | null>(null);

  private pagina = 1;

  ngOnInit(): void {
    void this.cargar();
    void this.cargarConciertos();
    void this.cargarSentimiento();
  }

  irA(pagina: number): void {
    this.pagina = pagina;
    void this.cargar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Cambia uno o varios filtros y vuelve a la primera página
  cambiarFiltro(cambios: Partial<AdminCommentFilters>): void {
    this.filtros.update((actuales) => ({ ...actuales, ...cambios }));
    this.pagina = 1;
    void this.cargar();
  }

  cambiarEstrellas(valor: string): void {
    this.cambiarFiltro({ rating: valor ? Number(valor) : null });
  }

  // Vuelve a los filtros iniciales; el campo de texto también se vacía
  limpiar(buscador: HTMLInputElement): void {
    buscador.value = '';
    this.filtros.set({ ...FILTROS_INICIALES });
    this.pagina = 1;
    void this.cargar();
  }

  porcentaje(valor: number, total: number): number {
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  resumenDe(concertId: string): ResumenIA | undefined {
    return this.resumenes()[concertId];
  }

  // Pide a la IA un resumen de las valoraciones del concierto (agente en el puerto 3001)
  async pedirResumen(concertId: string): Promise<void> {
    this.resumenes.update((actuales) => ({ ...actuales, [concertId]: { estado: 'cargando' } }));
    try {
      const respuesta = await fetch(`${environment.resumenUrl}/concierto/${concertId}`);
      if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
      const datos = (await respuesta.json()) as { resumen: string | null };
      const texto = datos.resumen ?? 'Todavía no hay suficientes valoraciones para resumir.';
      this.resumenes.update((actuales) => ({ ...actuales, [concertId]: { estado: 'listo', texto } }));
    } catch {
      this.resumenes.update((actuales) => ({ ...actuales, [concertId]: { estado: 'error' } }));
    }
  }

  estrellas(valor: number): string {
    return '★'.repeat(valor) + '☆'.repeat(5 - valor);
  }

  async borrar(comentario: AdminComment): Promise<void> {
    const confirmacion = await this.alerts.confirm('¿Borrar esta valoración?', 'Se borrará de forma definitiva.', 'Borrar');
    if (!confirmacion.isConfirmed) return;

    this.borrando.set(true);
    try {
      await this.commentService.remove(comentario._id);
      await this.cargar();
      void this.cargarSentimiento();
    } catch {
      // Lo muestra el interceptor de errores
    } finally {
      this.borrando.set(false);
    }
  }

  private async cargarSentimiento(): Promise<void> {
    try {
      const respuesta = await this.commentService.sentimientoPorConcierto();
      this.sentimiento.set(respuesta.data);
    } catch {
      // Lo muestra el interceptor de errores
    }
  }

  // Lista de conciertos para el desplegable del filtro
  private async cargarConciertos(): Promise<void> {
    try {
      const respuesta = await this.shop.getConcerts({ page: 1, limit: 100 });
      this.conciertos.set(respuesta.data);
    } catch {
      // Sin lista, el filtro de concierto se queda en "Todos los conciertos"
    }
  }

  private async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const respuesta = await this.commentService.listForAdmin(this.pagina, this.filtros());
      this.items.set(respuesta.data);
      this.pagination.set(respuesta.pagination);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido cargar las valoraciones.'));
    } finally {
      this.loading.set(false);
    }
  }
}
