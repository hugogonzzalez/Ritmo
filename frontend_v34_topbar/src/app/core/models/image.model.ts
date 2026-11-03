export interface ConcertImage {
  _id: string;
  url: string;
  alt: string;
  concertId: string | null;
  performanceId: string | null;
  categoryId?: string | null;
  venueId?: string | null;
  variantId?: string | null;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface ImagePayload {
  concertId?: string;
  performanceId?: string;
  artistId?: string;
  categoryId?: string;
  venueId?: string;
  variantId?: string;
  urls: string[];
  alt?: string;
}
