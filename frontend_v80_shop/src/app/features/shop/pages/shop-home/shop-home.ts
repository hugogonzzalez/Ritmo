import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { ShopArtist, ShopCategory, ShopVenue } from '../../../../core/models/shop.model';
import { ArtistCard } from '../../components/artist-card/artist-card';
import { CategoryCard } from '../../components/category-card/category-card';
import { VenueCard } from '../../components/venue-card/venue-card';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-shop-home',
  standalone: true,
  imports: [Carousel, CategoryCard, ArtistCard, VenueCard, SkeletonLoader, ErrorState],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      <section>
        <h1 class="sr-only">Encuentra tu próximo concierto</h1>
        <img src="/hero-concierto.png" alt="Encuentra tu próximo concierto"
             class="block w-full h-auto rounded-2xl shadow-lg" />
      </section>

      @if (store.catalogueLoading()) {
        <app-skeleton-loader />
      } @else if (store.catalogueError()) {
        <app-error-state [message]="store.catalogueError()!" (retry)="loadCatalogue()" />
      } @else {

        @if (store.categories().length > 0) {
          <section>
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Explora por categoría</h2>
            <app-carousel [items]="store.categories()" [visibleCount]="4">
              <ng-template #item let-category>
                <app-category-card [category]="category" (selected)="onCategorySelect($event)" />
              </ng-template>
            </app-carousel>
          </section>
        }

        @if (store.artists().length > 0) {
          <section>
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Artistas</h2>
            <app-carousel [items]="store.artists()" [visibleCount]="4">
              <ng-template #item let-artist>
                <app-artist-card [artist]="artist" (selected)="onArtistSelect($event)" />
              </ng-template>
            </app-carousel>
          </section>
        }

        @if (store.venues().length > 0) {
          <section>
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Salas</h2>
            <app-carousel [items]="store.venues()" [visibleCount]="4">
              <ng-template #item let-venue>
                <app-venue-card [venue]="venue" (selected)="onVenueSelect($event)" />
              </ng-template>
            </app-carousel>
          </section>
        }
      }
    </div>
  `
})
export class ShopHome implements OnInit {
  protected readonly store = inject(ShopStore);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadCatalogue();
  }

  async loadCatalogue(): Promise<void> {
    this.store.setCatalogueLoading(true);
    this.store.setCatalogueError(null);

    try {
      const [categories, artists, venues] = await Promise.all([
        this.shopService.getCategories(),
        this.shopService.getArtists(),
        this.shopService.getVenues()
      ]);
      this.store.setCatalogue(categories.data, artists.data, venues.data);
    } catch (error) {
      this.store.setCatalogueError(getApiErrorMessage(error, 'No se han podido cargar los datos de la tienda.'));
    } finally {
      this.store.setCatalogueLoading(false);
    }
  }

  // La URL manda: el listado lee ?category=... y aplica el filtro
  onCategorySelect(category: ShopCategory): void {
    void this.router.navigate(['/shop/concerts'], { queryParams: { category: category.slug } });
  }

  onArtistSelect(artist: ShopArtist): void {
    void this.router.navigate(['/shop/concerts'], { queryParams: { artist: artist.slug } });
  }

  onVenueSelect(venue: ShopVenue): void {
    void this.router.navigate(['/shop/concerts'], { queryParams: { venue: venue.slug } });
  }
}
