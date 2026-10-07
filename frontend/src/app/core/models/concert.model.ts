export const CONCERT_STATUSES = ['scheduled', 'full', 'cancelled', 'completed'] as const;

export type ConcertStatus = (typeof CONCERT_STATUSES)[number];

export interface Concert {
  _id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  price: number;
  description: string;
  slug: string;
  status: ConcertStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  __v?: number;
}

export interface ConcertPayload {
  title: string;
  venue: string;
  city: string;
  date: string;
  price: number;
  description?: string;
  status: ConcertStatus;
  isActive: boolean;
}

export type ConcertDraft = Pick<ConcertPayload, 'title' | 'venue' | 'city' | 'date' | 'price'>
  & Partial<Pick<ConcertPayload, 'description' | 'status' | 'isActive'>>;
