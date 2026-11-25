import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ChatbotService } from '../../../core/services/chatbot.service';

interface MensajeChat {
  role: 'user' | 'assistant';
  text: string;
}

// Botón flotante abajo a la derecha que despliega el chat del asistente IA.
@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  template: `
    <button type="button" (click)="toggle()" [attr.aria-expanded]="abierto()" aria-label="Abrir asistente virtual"
            class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1d0b55] text-white shadow-lg transition hover:scale-105 hover:shadow-xl">
      @if (!abierto()) {
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 6l-2.5-2.5H6a3 3 0 01-3-3V7a3 3 0 013-3h12a3 3 0 013 3v7a3 3 0 01-3 3h-1.5L12 21z" />
        </svg>
      } @else {
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      }
    </button>

    @if (abierto()) {
      <section aria-label="Asistente virtual"
               class="fixed bottom-24 right-6 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <header class="flex items-center justify-between bg-[#1d0b55] px-5 py-4 text-white">
          <h2 class="text-sm font-semibold">Asistente de Ritmo</h2>
          <button type="button" (click)="toggle()" aria-label="Cerrar asistente"
                  class="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-white/80 transition hover:bg-white/10 hover:text-white">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div #scroll class="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
          @for (mensaje of mensajes(); track $index) {
            <div [class]="mensaje.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <p [class]="mensaje.role === 'user'
                  ? 'max-w-[80%] whitespace-pre-line rounded-2xl rounded-br-sm bg-[#1684ff] px-3.5 py-2 text-sm text-white shadow-sm'
                  : 'max-w-[80%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-gray-800 shadow-sm'">{{ mensaje.text }}</p>
            </div>
          }
          @if (cargando()) {
            <p class="text-xs text-gray-400">Escribiendo…</p>
          }
        </div>

        @if (error()) {
          <p class="px-4 py-2 text-xs text-red-600">{{ error() }}</p>
        }

        <form (submit)="enviar($event)" class="flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
          <input type="text" name="mensaje" maxlength="500" placeholder="Escribe aquí tu consulta"
                 [value]="borrador()" (input)="borrador.set($any($event.target).value)"
                 class="h-11 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1684ff]" />
          <button type="submit" aria-label="Enviar mensaje" [disabled]="cargando() || !borrador().trim()"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-[#1684ff] p-0 text-white shadow-sm transition hover:bg-[#1769bd] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L4 4l16 8-16 8 2-8zm0 0h8" />
            </svg>
          </button>
        </form>
      </section>
    }
  `
})
export class ChatbotWidget {
  private readonly chatbot = inject(ChatbotService);
  private readonly scroll = viewChild<ElementRef<HTMLDivElement>>('scroll');

  // Un identificador por visita: el backend guarda el historial con este id
  private readonly sessionId = crypto.randomUUID();

  readonly abierto = signal(false);
  readonly mensajes = signal<MensajeChat[]>([
    { role: 'assistant', text: '¡Hola! Soy el asistente de Ritmo. Pregúntame sobre este concierto, sus sesiones o sus entradas.' }
  ]);
  readonly borrador = signal('');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  toggle(): void {
    this.abierto.update(valor => !valor);
    this.bajarScroll();
  }

  async enviar(event: Event): Promise<void> {
    event.preventDefault();
    const texto = this.borrador().trim();
    if (!texto || this.cargando()) return;

    this.mensajes.update(lista => [...lista, { role: 'user', text: texto }]);
    this.borrador.set('');
    this.cargando.set(true);
    this.error.set(null);
    this.bajarScroll();

    try {
      const respuesta = await this.chatbot.enviar(texto, this.sessionId);
      this.mensajes.update(lista => [...lista, { role: 'assistant', text: respuesta }]);
    } catch (fallo) {
      this.error.set(fallo instanceof Error ? fallo.message : 'No se pudo enviar el mensaje.');
    } finally {
      this.cargando.set(false);
      this.bajarScroll();
    }
  }

  // Espera a que Angular pinte el mensaje nuevo y baja al final de la conversación
  private bajarScroll(): void {
    setTimeout(() => {
      const elemento = this.scroll()?.nativeElement;
      if (elemento) elemento.scrollTop = elemento.scrollHeight;
    });
  }
}
