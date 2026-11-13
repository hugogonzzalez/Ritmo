// Datos públicos de la tienda: solo los campos que devuelve /api/shop

// Orden de la lista: 'default' = más recientes primero
export type ShopSort = 'default' | 'date_asc' | 'price_asc' | 'price_desc' | 'title_asc';

export interface ShopFilters {
  categorySlug: string | null;
  artistSlug: string | null;
  venueSlug: string | null;
  search: string;
  // null = sin límite en ese extremo
  minPrice: number | null;
  maxPrice: number | null;
  sort: ShopSort;
  page: number;
  limit: number;
}

export interface ShopPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShopCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
}

export interface ShopArtist {
  _id: string;
  name: string;
  slug: string;
  bio: string;
  images: string[];
}

export interface ShopVenue {
  _id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  capacity: number;
  // Opcional: el backend puede devolver URLs sueltas o objetos { url, alt }
  images?: Array<string | { url: string }>;
}

export interface ShopConcert {
  _id: string;
  title: string;
  slug: string;
  description: string;
  status: 'scheduled' | 'full' | 'cancelled' | 'completed';
  images: string[];
  artists: Array<Pick<ShopArtist, '_id' | 'name' | 'slug' | 'bio'> & { images?: string[] }>;
  categories: Array<Pick<ShopCategory, '_id' | 'name' | 'slug'>>;
  createdAt: string;
}

export interface ShopPerformance {
  _id: string;
  slug: string;
  city: string;
  startsAt: string;
  endsAt: string | null;
  price: number;
  bookedParticipants: number;
  status: string;
  venue: ShopVenue | null;
}

export interface ShopVariant {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
  images: string[];
}

export interface ShopConcertsResponse {
  success: boolean;
  message: string;
  data: ShopConcert[];
  pagination: ShopPagination;
}
