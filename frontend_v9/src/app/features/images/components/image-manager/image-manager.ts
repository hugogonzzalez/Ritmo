import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { LucideImage, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { AlertService } from '../../../../core/services/alert.service';
import { ImageService } from '../../../../core/services/image.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ConcertImage } from '../../../../core/models/image.model';

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

      @if (error()) { <div class="image-error" role="alert">{{ error() }}</div> }

      <div class="image-field">
        <label for="image-urls">URLs de las imágenes</label>
        <textarea id="image-urls" rows="3" placeholder="https://..." [value]="urlsText()" (input)="setUrls($event)"></textarea>
      </div>
      <div class="image-actions">
        <button type="button" class="image-add" [disabled]="saving()" (click)="add()">
          <svg lucidePlus [size]="16"></svg>{{ saving() ? 'Añadiendo…' : 'Añadir imágenes' }}
        </button>
      </div>

      @if (loading()) {
        <app-skeleton-loader [count]="3" />
      } @else if (images().length === 0) {
        <p class="image-empty">Todavía no hay imágenes.</p>
      } @else {
        <ol class="image-grid">
          @for (image of images(); track image._id; let i = $index) {
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
  styles: [`.image-card{margin-top:22px;padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 3px 12px #18223206}.image-title{display:flex;align-items:center;gap:11px;margin-bottom:18px}.image-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#eaf3ff;color:#0878f9}.image-title h2{margin:0;color:#263143;font:700 14px 'Space Grotesk',sans-serif}.image-title p{margin:4px 0 0;color:#919aa8;font-size:10px}.image-field{display:flex;flex-direction:column;gap:7px}.image-field label{color:#465166;font-size:10px;font-weight:700}.image-field textarea{width:100%;border:1px solid #dfe4eb;border-radius:8px;padding:10px 11px;font:inherit;font-size:11px;resize:vertical;outline:0}.image-field textarea:focus{border-color:#0878f9;box-shadow:0 0 0 3px #0878f918}.image-actions{display:flex;justify-content:flex-end;margin:12px 0 18px}.image-add{min-height:39px;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:8px;background:#0878f9;color:#fff;padding:0 15px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.image-add:hover{background:#0669dc}.image-add:disabled{opacity:.6;cursor:wait}.image-error{margin-bottom:12px;padding:10px 12px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.image-empty{margin:0;color:#8993a2;font-size:11px}.image-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin:0;padding:0;list-style:none}.image-item{position:relative;overflow:hidden;border:1px solid #e6eaf0;border-radius:10px;background:#f8fafc}.image-item img{display:block;width:100%;height:120px;object-fit:cover}.image-number{position:absolute;left:8px;top:8px;min-width:22px;height:22px;display:grid;place-items:center;border-radius:99px;background:#0878f9;color:#fff;font-size:10px;font-weight:700}.image-delete{position:absolute;right:8px;top:8px;width:28px;height:28px;display:grid;place-items:center;border:1px solid #ffc4c4;border-radius:7px;background:#fff;color:#ce3339;cursor:pointer}.image-delete:hover{background:#fff3f3}`]
})
export class ImageManager implements OnInit {
  @Input({ required: true }) ownerType!: 'concert' | 'performance' | 'artist';
  @Input({ required: true }) ownerId!: string;

  private readonly imageService = inject(ImageService);
  private readonly alerts = inject(AlertService);

  readonly images = signal<ConcertImage[]>([]);
  readonly urlsText = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  setUrls(event: Event): void {
    this.urlsText.set((event.target as HTMLTextAreaElement).value);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const images = this.ownerType === 'concert'
        ? await this.imageService.listByConcert(this.ownerId)
        : this.ownerType === 'performance'
          ? await this.imageService.listByPerformance(this.ownerId)
          : await this.imageService.listByArtist(this.ownerId);
      this.images.set(images);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido cargar las imágenes.'));
    } finally {
      this.loading.set(false);
    }
  }

  async add(): Promise<void> {
    this.error.set(null);
    const urls = this.urlsText().split('\n').map((url) => url.trim()).filter((url) => url !== '');

    if (urls.length === 0) {
      this.error.set('Pega al menos una URL.');
      return;
    }
    if (urls.length > MAX_URLS_PER_ADD) {
      this.error.set(`Como máximo puedes añadir ${MAX_URLS_PER_ADD} URLs a la vez.`);
      return;
    }
    if (urls.some((url) => !URL_PATTERN.test(url))) {
      this.error.set('Revisa las URLs: tienen que empezar por http:// o https://');
      return;
    }

    this.saving.set(true);
    try {
      const owner = this.ownerType === 'concert'
        ? { concertId: this.ownerId }
        : this.ownerType === 'performance'
          ? { performanceId: this.ownerId }
          : { artistId: this.ownerId };
      await this.imageService.create({ ...owner, urls });
      this.urlsText.set('');
      await this.load();
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se han podido añadir las imágenes.'));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(image: ConcertImage): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar imagen?', 'La imagen dejará de mostrarse.', 'Eliminar');
    if (!confirmation.isConfirmed) return;

    try {
      await this.imageService.remove(image._id);
      this.images.update((current) => current.filter((item) => item._id !== image._id));
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'No se ha podido eliminar la imagen.'));
    }
  }
}
