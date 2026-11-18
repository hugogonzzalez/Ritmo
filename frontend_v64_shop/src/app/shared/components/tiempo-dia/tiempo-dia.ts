import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ShopPerformance } from '../../../core/models/shop.model';
import { TiempoDia } from '../../../core/models/tiempo.model';
import { TiempoService } from '../../../core/services/tiempo.service';

type EstadoTiempo =
  | { tipo: 'cargando' }
  | { tipo: 'sin-ciudad' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'dato'; dia: TiempoDia };

// Tiempo previsto para el día de la sesión elegida (se usa en la página de detalle del concierto)
@Component({
  selector: 'app-tiempo-dia',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-blue-600">Previsión</p>
          <h2 class="text-lg font-bold text-gray-900">El tiempo ese día</h2>
        </div>
        <span class="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {{ sesion().startsAt | date: 'dd/MM/yyyy' }}
        </span>
      </div>

      @switch (estado().tipo) {
        @case ('cargando') {
          <div class="flex animate-pulse items-center gap-4">
            <div class="h-14 w-14 rounded-2xl bg-gray-100"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/2 rounded bg-gray-100"></div>
              <div class="h-3 w-1/3 rounded bg-gray-100"></div>
            </div>
          </div>
        }
        @case ('sin-ciudad') {
          <p class="text-sm text-gray-500">Esta sesión no tiene ciudad, así que no podemos consultar el tiempo.</p>
        }
        @case ('error') {
          <p class="text-sm text-red-600">{{ $any(estado()).mensaje }}</p>
        }
        @case ('dato') {
          @if ($any(estado()).dia; as dia) {
            @if (dia.disponible) {
              <div class="flex items-center gap-4">
                <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-3xl" aria-hidden="true">{{ dia.icono }}</span>
                <div class="min-w-0">
                  <p class="text-base font-semibold text-gray-900">{{ dia.descripcion }}</p>
                  <p class="text-sm text-gray-500">{{ dia.ciudad }}</p>
                </div>
              </div>

              <div class="mt-5 grid grid-cols-3 gap-3">
                <div class="rounded-xl bg-gray-50 p-3 text-center">
                  <p class="text-xs text-gray-500">Máxima</p>
                  <p class="mt-1 text-lg font-bold text-gray-900">{{ dia.maxima }}°</p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 text-center">
                  <p class="text-xs text-gray-500">Mínima</p>
                  <p class="mt-1 text-lg font-bold text-gray-900">{{ dia.minima }}°</p>
                </div>
                <div class="rounded-xl bg-gray-50 p-3 text-center">
                  <p class="text-xs text-gray-500">Lluvia</p>
                  <p class="mt-1 text-lg font-bold text-gray-900">{{ dia.probabilidadLluvia }}%</p>
                </div>
              </div>
            } @else {
              <p class="text-sm text-gray-600">{{ dia.motivo }}</p>
            }
          }
        }
      }
    </section>
  `
})
export class TiempoDiaCard {
  readonly titulo = input.required<string>();
  readonly sesion = input.required<ShopPerformance>();

  private readonly tiempoService = inject(TiempoService);
  readonly estado = signal<EstadoTiempo>({ tipo: 'cargando' });
  private peticion = 0;

  constructor() {
    // Cada vez que cambia la sesión elegida, se pide el tiempo de su día
    effect(() => {
      const sesion = this.sesion();
      const titulo = this.titulo();
      untracked(() => void this.cargar(titulo, sesion));
    });
  }

  private async cargar(titulo: string, sesion: ShopPerformance): Promise<void> {
    const id = ++this.peticion;
    const ciudad = sesion.city || sesion.venue?.city;
    if (!ciudad) {
      this.estado.set({ tipo: 'sin-ciudad' });
      return;
    }

    this.estado.set({ tipo: 'cargando' });
    // Fecha en formato AAAA-MM-DD, según la hora de España
    const fecha = new Date(sesion.startsAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

    try {
      const resultado = await this.tiempoService.obtener(titulo, ciudad, fecha);
      if (id === this.peticion) this.estado.set({ tipo: 'dato', dia: resultado.tiempo });
    } catch (error) {
      console.error('[Tiempo]', error instanceof Error ? error.message : error);
      if (id === this.peticion) {
        this.estado.set({ tipo: 'error', mensaje: 'No se pudo cargar el tiempo de este día.' });
      }
    }
  }
}
