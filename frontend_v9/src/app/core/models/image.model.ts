export interface ConcertImage {
  _id: string;
  url: string;
  alt: string;
  concertId: string | null;
  performanceId: string | null;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface ImagePayload {
  concertId?: string;
  performanceId?: string;
  artistId?: string;
  urls: string[];
  alt?: string;
}
