import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { LucideImage, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { AlertService } from '../../../../core/services/alert.service';
import { ConcertImage, ImagePayload } from '../../../../core/models/image.model';
import { QueryParams } from '../../../../core/models/api.model';
import { ImageService } from '../../../../core/services/image.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ImageOwnerType, ImagesStore } from '../../../../core/stores/images.store';

const MAX_URLS_PER_ADD = 20;
const URL_PATTERN = /^https?:\/\/\S+$/i;

@Component({
  selector: 'app-image-manager',
  standalone: true,
  imports: [SkeletonLoader, LucideImage, LucidePlus, LucideTrash2],
  template: `
    <section class="image-card">
      <div class="image-title">
        <span class="image-icon"><svg lucideImage [size]="18"></svg></span>
        <div><h2>Imágenes</h2><p>Pega una URL por línea. Se muestran en el orden en que se añaden.</p></div>
      </div>

      @if (localError() || store.error()) { <div class="image-error" role="alert">{{ localError() || store.error() }}</div> }

      <div class="image-field">
        <label for="image-urls">URLs de las imágenes</label>
        <textarea id="image-urls" rows="3" placeholder="https://..." [value]="urlsText()" (input)="setUrls($event)"></textarea>
      </div>
      <div class="image-actions">
        <button type="button" class="image-add" [disabled]="store.saving()" (click)="add()">
          <svg lucidePlus [size]="16"></svg>{{ store.saving() ? 'Añadiendo…' : 'Añadir imágenes' }}
        </button>
      </div>

      @if (!ownerId) {
        @if (pendingUrls().length === 0) {
          <p class="image-empty">Las imágenes se guardarán al crear.</p>
        } @else {
          <ol class="image-grid">
            @for (url of pendingUrls(); track $index; let i = $index) {
              <li class="image-item">
                <img [src]="url" [alt]="'Imagen pendiente ' + (i + 1)" />
                <span class="image-number">{{ i + 1 }}</span>
                <button type="button" class="image-delete" (click)="removePending(i)" [attr.aria-label]="'Quitar imagen ' + (i + 1)">
                  <svg lucideTrash2 [size]="14"></svg>
                </button>
              </li>
            }
          </ol>
        }
      } @else if (store.loading()) {
        <app-skeleton-loader [count]="3" />
      } @else if (store.images().length === 0) {
        <p class="image-empty">Todavía no hay imágenes.</p>
      } @else {
        <ol class="image-grid">
          @for (image of store.images(); track image._id; let i = $index) {
            <li class="image-item">
              <img [src]="image.url" [alt]="image.alt || 'Imagen ' + (i + 1)" />
              <span class="image-number">{{ i + 1 }}</span>
              <button type="button" class="image-delete" (click)="remove(image)" [attr.aria-label]="'Eliminar imagen ' + (i + 1)">
                <svg lucideTrash2 [size]="14"></svg>
              </button>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: [`.image-card{margin-top:22px;padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.image-title{display:flex;align-items:center;gap:11px;margin-bottom:18px}.image-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.image-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.image-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.image-field{display:flex;flex-direction:column;gap:7px}.image-field label{color:#465166;font-size:10px;font-weight:700}.image-field textarea{width:100%;border:1px solid #dfe4eb;border-radius:8px;padding:10px 11px;font:inherit;font-size:11px;resize:vertical;outline:0}.image-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.image-field textarea:disabled{background:#f6f8fa;color:#9aa3b1;cursor:not-allowed}.image-actions{display:flex;justify-content:flex-end;margin:12px 0 18px}.image-add{min-height:39px;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:8px;background:#0878f9;color:#fff;padding:0 15px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.image-add:hover{background:#0669dc}.image-add:disabled{opacity:.6;cursor:not-allowed}.image-error{margin-bottom:12px;padding:10px 12px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.image-empty{margin:0;color:#8993a2;font-size:11px}.image-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin:0;padding:0;list-style:none}.image-item{position:relative;overflow:hidden;border:1px solid #e6eaf0;border-radius:10px;background:#f8fafc}.image-item img{display:block;width:100%;height:120px;object-fit:cover}.image-number{position:absolute;left:8px;top:8px;min-width:22px;height:22px;display:grid;place-items:center;border-radius:99px;background:#0878f9;color:#fff;font-size:10px;font-weight:700}.image-delete{position:absolute;right:8px;top:8px;width:28px;height:28px;display:grid;place-items:center;border:1px solid #ffc4c4;border-radius:7px;background:#fff;color:#ce3339;cursor:pointer}.image-delete:hover{background:#fff3f3}`]
})
export class ImageManager implements OnInit {
  @Input({ required: true }) ownerType!: ImageOwnerType;
  // Null mientras el elemento no está guardado: la galería se muestra deshabilitada.
  @Input() ownerId: string | null = null;

  readonly store = inject(ImagesStore);
  private readonly imageService = inject(ImageService);
  private readonly alerts = inject(AlertService);

  readonly urlsText = signal('');
  readonly localError = signal<string | null>(null);
  // URLs elegidas antes de guardar la entidad (solo en crear); se suben con saveFor()
  readonly pendingUrls = signal<string[]>([]);

  ngOnInit(): void {
    if (this.ownerId) void this.load();
  }

  setUrls(event: Event): void {
    this.urlsText.set((event.target as HTMLTextAreaElement).value);
  }

  async load(): Promise<void> {
    if (!this.ownerId) return;

    this.store.setLoading(true);
    this.store.setError(null);
    this.store.setItems([]);
    try {
      const response = await this.imageService.getAll(this.ownerParams(this.ownerId));
      this.store.setItems(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar las imágenes.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async add(): Promise<void> {
    const ownerId = this.ownerId;

    this.localError.set(null);
    this.store.clearError();
    const urls = this.urlsText().split('\n').map((url) => url.trim()).filter((url) => url !== '');

    if (urls.length === 0) {
      this.localError.set('Pega al menos una URL.');
      return;
    }
    if (urls.length > MAX_URLS_PER_ADD) {
      this.localError.set(`Como máximo puedes añadir ${MAX_URLS_PER_ADD} URLs a la vez.`);
      return;
    }
    if (urls.some((url) => !URL_PATTERN.test(url))) {
      this.localError.set('Revisa las URLs: tienen que empezar por http:// o https://');
      return;
    }

    if (!ownerId) {
      this.pendingUrls.update((list) => [...list, ...urls]);
      this.urlsText.set('');
      return;
    }

    this.store.setSaving(true);
    try {
      await this.imageService.create({ ...this.ownerPayload(ownerId), urls } as ImagePayload);
      this.urlsText.set('');
      const response = await this.imageService.getAll(this.ownerParams(ownerId));
      this.store.setItems(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido añadir las imágenes.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  async remove(image: ConcertImage): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar imagen?', 'La imagen dejará de mostrarse.', 'Eliminar');
    if (!confirmation.isConfirmed) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      await this.imageService.softDelete(image._id);
      this.store.remove(image._id);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido eliminar la imagen.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  removePending(index: number): void {
    this.pendingUrls.update((list) => list.filter((_, position) => position !== index));
  }

  // La página de crear la llama cuando la entidad ya tiene _id: sube las URLs pendientes.
  async saveFor(ownerId: string): Promise<void> {
    const urls = this.pendingUrls();
    if (urls.length === 0) return;

    await this.imageService.create({ ...this.ownerPayload(ownerId), urls } as ImagePayload);
    this.pendingUrls.set([]);
  }

  private ownerParams(id: string): QueryParams {
    switch (this.ownerType) {
      case 'concert': return { concertId: id };
      case 'performance': return { performanceId: id };
      case 'category': return { categoryId: id };
      case 'venue': return { venueId: id };
      case 'variant': return { variantId: id };
      default: return { artistId: id };
    }
  }

  private ownerPayload(id: string): Partial<ImagePayload> {
    switch (this.ownerType) {
      case 'concert': return { concertId: id };
      case 'performance': return { performanceId: id };
      case 'category': return { categoryId: id };
      case 'venue': return { venueId: id };
      case 'variant': return { variantId: id };
      default: return { artistId: id };
    }
  }
}
