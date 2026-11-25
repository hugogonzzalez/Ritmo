import { Component, effect, input, signal, untracked } from '@angular/core';
import { environment } from '../../../../../environments/environment';

interface ResumenConcierto {
  titulo: string;
  total: number;
  resumen: string | null;
}

// Resumen de las valoraciones de un concierto, escrito por el agente de IA (puerto 3001)
@Component({
  selector: 'app-concert-summary',
  standalone: true,
  host: { class: 'block' },
  template: `
    <section class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-[#1684ff]">Resumen de las valoraciones</span>
        <span class="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 shadow-sm">IA</span>
      </div>

      @switch (estado()) {
        @case ('cargando') {
          <div class="mt-4 h-12 animate-pulse rounded-lg bg-white/70"></div>
        }
        @case ('listo') {
          <p class="mt-3 text-sm leading-relaxed text-gray-700">{{ resumen() }}</p>
          <p class="mt-2 text-xs text-gray-400">
            Basado en {{ total() }} {{ total() === 1 ? 'valoración' : 'valoraciones' }}.
          </p>
        }
        @case ('vacio') {
          <p class="mt-3 text-sm text-gray-500">Todavía no hay valoraciones que resumir.</p>
        }
        @default {
          <p class="mt-3 text-sm text-gray-500">No se ha podido generar el resumen en este momento.</p>
        }
      }
    </section>
  `
})
export class ConcertSummary {
  readonly concertId = input.required<string>();

  protected readonly estado = signal<'cargando' | 'listo' | 'vacio' | 'error'>('cargando');
  protected readonly resumen = signal<string | null>(null);
  protected readonly total = signal(0);

  private requestId = 0;

  constructor() {
    effect(() => {
      const id = this.concertId();
      untracked(() => void this.cargar(id));
    });
  }

  private async cargar(concertId: string): Promise<void> {
    const id = ++this.requestId;
    this.estado.set('cargando');

    try {
      const respuesta = await fetch(`${environment.resumenUrl}/concierto/${concertId}`);
      if (!respuesta.ok) throw new Error(`Respuesta ${respuesta.status}`);

      const datos = (await respuesta.json()) as ResumenConcierto;
      if (id !== this.requestId) return;

      this.total.set(datos.total);
      this.resumen.set(datos.resumen);
      this.estado.set(datos.resumen ? 'listo' : 'vacio');
    } catch {
      if (id !== this.requestId) return;
      this.estado.set('error');
    }
  }
}
