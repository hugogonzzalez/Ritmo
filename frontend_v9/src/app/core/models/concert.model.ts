export const CONCERT_STATUSES = ['scheduled', 'full', 'cancelled', 'completed'] as const;

export type ConcertStatus = (typeof CONCERT_STATUSES)[number];

export interface ConcertArtist {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  images: string[];
}

export interface Concert {
  _id: string;
  title: string;
  description: string;
  slug: string;
  status: ConcertStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  images: string[];
  artistIds: string[];
  artists: ConcertArtist[];
  __v?: number;
}

export interface ConcertPayload {
  title: string;
  description?: string;
  status: ConcertStatus;
  isActive: boolean;
  artistIds?: string[];
}

export type ConcertDraft = Pick<ConcertPayload, 'title'>
  & Partial<Pick<ConcertPayload, 'description' | 'status' | 'isActive'>>;
